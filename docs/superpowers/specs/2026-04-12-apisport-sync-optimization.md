# ApiSport Sync — Query Optimization & Data Redundancy Audit

Audit of the `ApiSportSyncService` for N+1 query problems, data redundancy, and performance improvements.

**Status:** Issues identified, not yet fixed. Apply when prioritized.

---

## N+1 Query Problems

### Critical — High query count, runs on every sync

**1. `syncTeams()` — ~144 queries for 48 teams**

For each team in the API response (48):

- `teamRepository.findByApiId(apiId)` — 1 SELECT
- `teamRepository.save(team)` — 1 INSERT or UPDATE
- `teamTournamentRepository.findByTeamIdAndTournamentId(...)` — 1 SELECT
- Possibly `teamTournamentRepository.save(...)` — 1 INSERT

Total: ~48×3 = 144 queries.

**Fix:** Pre-load all existing teams and team_tournaments into maps before the loop:

```kotlin
val existingTeams = teamRepository.findAll().associateBy { it.apiId }
val existingTT = teamTournamentRepository.findByTournamentId(tournament.id)
    .associate { (it.team.id to it.tournament.id) to it }
```

Lookup from maps in the loop, batch `saveAll()` after. Reduces to ~4 queries.

---

**2. `syncPlayers()` — ~3600 queries for ~1200 players**

For each team (48), for each player (~25 per team):

- `playerRepository.findByApiId(apiId)` — 1 SELECT
- `playerRepository.save(player)` — 1 INSERT or UPDATE
- `playerTournamentRepository.findByPlayerIdAndTournamentId(...)` — 1 SELECT
- Possibly `playerTournamentRepository.save(...)` — 1 INSERT

Total: ~1200×3 = 3600 queries (across 48 API calls due to rate limiting).

**Fix:** Pre-load all existing players and player_tournaments:

```kotlin
val existingPlayers = playerRepository.findAll().associateBy { it.apiId }
val existingPT = playerTournamentRepository.findByTournamentId(tournament.id)
    .associate { it.player.apiId to it }
```

Accumulate changes, batch `saveAll()` per team. Reduces to ~50 queries (1 pre-load + 1 save per team).

---

**3. `syncGames()` — ~500+ queries for 72+ games**

For each fixture in the API response (72+):

- `gameRepository.findByApiId(apiId)` — 1 SELECT
- `gameRepository.save(game)` — 1 INSERT or UPDATE
- `upsertGameTeam()` ×2, each does:
    - `gameTeamRepository.findByGameId(game.id)` — 1 SELECT
    - `teamRepository.findByApiId(teamApiId)` — 1 SELECT
    - `gameTeamRepository.save(...)` — 1 INSERT or UPDATE

Total: ~72×7 = 504 queries.

**Fix:** Pre-load existing games, teams, and game_teams:

```kotlin
val existingGames = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
    .associateBy { it.apiId }
val existingTeams = teamRepository.findAll().associateBy { it.apiId }
val existingGameTeams = gameTeamRepository.findAll()
    .groupBy { it.game.id }
```

Batch saves after the loop. Reduces to ~5 queries.

---

### Low Impact — Small data sets, acceptable

**4. `syncGameStatuses()` — N+1 on game_teams per status change**

For each game that changed status:

- `gameTeamRepository.findByGameId(game.id)` — 1 SELECT
- `gameTeamRepository.save(home)` + `gameTeamRepository.save(away)` — 2 UPDATEs

Typically 1-4 games change status per live sync cycle. Max ~12 queries. Acceptable.

**Potential improvement:** Pre-load game_teams for all `gamesToCheck` with a single `WHERE game_id IN (...)` query.

---

**5. `syncMissingGoals()` — N+1 on game_teams + goal count**

For each recently finished game:

- `gameTeamRepository.findByGameId(game.id)` — 1 SELECT
- `gameGoalRepository.countByGameId(game.id)` — 1 SELECT

Typically 1-4 finished games in the last 24h. Max ~8 queries. Acceptable.

**Potential improvement:** Single query joining game_teams scores with goal counts.

---

**6. `syncGoals()` — N+1 on player lookup per goal**

For each goal event in a game (typically 2-5):

- `playerRepository.findByApiId(playerApiId)` — 1 SELECT
- `gameGoalRepository.save(...)` — 1 INSERT

Called once per finished game. ~10 queries per game. Acceptable given low frequency.

**Potential improvement:** Pre-load relevant players before the loop.

---

## Redundant Data Loading

**7. `updateTournamentDates()` — loads ALL games to find two**

`gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)` loads all 72+ games into memory just to read
`games.first().startedAt` and find one game with `phase == "final"`.

**Fix:** Two targeted queries:

```kotlin
// First game
gameRepository.findFirstByTournamentIdOrderByStartedAtAsc(tournament.id)
// Final game
gameRepository.findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournament.id, "final")
```

---

**8. `syncGames()` calls `updateTournamentDates()` every run**

Every daily sync and every `syncGames()` call updates the tournament dates. The dates only change when the schedule
changes (rare) or when the final game is first added.

**Fix:** Only call `updateTournamentDates()` if a game was newly created (not just updated). Track whether any new games
were inserted during the loop.

---

**9. `syncGameStatuses()` fetches full fixtures list**

`client.get("fixtures", leagueSeasonParams())` returns all 72+ fixtures with full details when we only need status +
scores for a handful of games.

**Alternative:** Use `client.get("fixtures", mapOf("id" to apiIds.joinToString("-")))` to fetch only the specific
fixtures by ID. The ApiSport `ids` parameter accepts comma-separated fixture IDs. This would return only the 1-4 games
we care about instead of 72+. Saves bandwidth and parsing time.

**Trade-off:** Multiple IDs in one call still counts as 1 API call. No downside.

---

## Data Redundancy

**10. `GameTeam.score` — intentional denormalization**

The score is stored on `game_teams.score` and also available from the API on every fixtures call. This is correct — it's
the local cache of the result. The score could also be derived by counting `game_goals` per team, but having it on
`game_teams` avoids that join for display purposes.

**No action needed.** This is the right design.

---

**11. `game_goals.team_id` — derivable from player's national team**

The `team_id` on `game_goals` could theoretically be derived from the player's `national_id` (for normal goals) or the
opposite team (for own goals). However, storing it explicitly is correct because:

- Own goals require knowing which team was credited
- A player could change national teams (edge case)
- Avoids a join when querying goals by team

**No action needed.**

---

## Priority Order

| #   | Issue                              | Impact             | Effort | Priority |
|-----|------------------------------------|--------------------|--------|----------|
| 2   | syncPlayers N+1                    | ~3600 queries      | Medium | High     |
| 3   | syncGames N+1                      | ~500 queries       | Medium | High     |
| 1   | syncTeams N+1                      | ~144 queries       | Low    | Medium   |
| 9   | syncGameStatuses full fetch        | Bandwidth          | Low    | Medium   |
| 7   | updateTournamentDates loads all    | Memory             | Low    | Low      |
| 8   | updateTournamentDates on every run | Unnecessary writes | Low    | Low      |
| 4-6 | Low-volume N+1s                    | <12 queries each   | Low    | Low      |

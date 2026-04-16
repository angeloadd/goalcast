# ApiSport Extraction & Optimization Design

Extract remaining JSON mapping logic from `ApiSportSyncService` into the `apisport` package (mapper + service + DTOs). Fix N+1 query and redundant loading issues from the optimization audit. Unit test only the `apisport` package classes.

---

## Enums

In `com.goalcast.apisport.dto`:

```kotlin
enum class GamePhase(val dbValue: String) {
    GROUP("group"),
    ROUND_OF_32("round_of_32"),
    ROUND_OF_16("round_of_16"),
    QUARTER("quarter"),
    SEMI("semi"),
    FINAL("final");
}

enum class GameStatus(val dbValue: String) {
    NOT_STARTED("not_started"),
    ONGOING("ongoing"),
    FINISHED("finished");
}
```

Each enum carries a `dbValue` property matching the CHECK constraint strings in the database. Consumers (e.g., `ApiSportSyncService`) use `phase.dbValue` when writing to entities. The enums live inside the `apisport.dto` package — they don't leak into the entity layer.

## DTOs

All in `com.goalcast.apisport.dto`:

```kotlin
// Existing
data class SyncedTournament(apiId: Int, name: String, country: String, logo: String, isCup: Boolean, season: Int)

// New
data class SyncedTeam(apiId: Int, name: String, code: String?, logo: String?, isNational: Boolean)
data class SyncedPlayer(apiId: Int, displayedName: String)
data class SyncedGame(apiId: Int, stage: String, phase: GamePhase, status: GameStatus, startedAt: Instant, homeTeamApiId: Int, awayTeamApiId: Int, homeScore: Int?, awayScore: Int?)
data class SyncedGoal(playerApiId: Int, scoringTeamApiId: Int, isOwnGoal: Boolean, scoredAt: Int)
data class SyncedTopScorer(playerApiId: Int)
```

`SyncedGame.phase` and `SyncedGame.status` are typed enums. The mapper converts raw API strings (e.g., `"Group Stage - 1"`, `"FT"`) into the corresponding enum values.

---

## ApiSportMapper

Single class `com.goalcast.apisport.mapper.ApiSportMapper`. All methods. Test files split by domain.

### Methods

| Method | Input | Output |
|--------|-------|--------|
| `mapToSyncedTournament(entry, id, season)` | exists | `SyncedTournament` |
| `mapToSyncedTeams(response)` | `List<JsonNode>` | `List<SyncedTeam>` |
| `mapToSyncedPlayers(response)` | `List<JsonNode>` (single team squad) | `List<SyncedPlayer>` |
| `mapToSyncedGames(response)` | `List<JsonNode>` | `List<SyncedGame>` |
| `mapToSyncedGoals(response)` | `List<JsonNode>` (events for one game) | `List<SyncedGoal>` |
| `mapToSyncedTopScorers(response)` | `List<JsonNode>` | `List<SyncedTopScorer>` |

### Private helpers (moved from ApiSportSyncService)

- `mapRoundToPhase(round: String): GamePhase` — maps `"Group Stage - 1"` to `GamePhase.GROUP`, `"Quarter-finals"` to `GamePhase.QUARTER`, etc. Defaults to `GamePhase.GROUP` for unrecognized patterns.
- `mapApiStatus(short: String): GameStatus` — maps `"FT"/"AET"/"PEN"` to `GameStatus.FINISHED`, `"1H"/"HT"/"2H"/...` to `GameStatus.ONGOING`, else `GameStatus.NOT_STARTED`.
- `isPenaltyShootoutGoal(elapsed, extra, comment): Boolean` — filters penalty shootout goals (elapsed == 120, extra > 0, comment contains "Penalty")
- `requireString(JsonNode, field, id, season)` — existing extension function for validation

### Mapping rules

**Teams:** `response[].team.{id, name, code, logo, national}` → `SyncedTeam`

**Players:** `response[0].players[].{id, name}` → `SyncedPlayer`. Returns empty list if response is empty.

**Games:** For each fixture node:
- `fixture.id` → `apiId`
- `fixture.timestamp` → `startedAt` (via `Instant.ofEpochSecond`)
- `league.round` → `stage` (raw) + `phase` (via `mapRoundToPhase`)
- `fixture.status.short` → `status` (via `mapApiStatus`)
- `teams.home.id` / `teams.away.id` → team API IDs
- `goals.home` / `goals.away` → scores (null-safe)

**Goals:** For each event node:
- Skip if `detail` contains `"Missed"`
- Skip if penalty shootout goal (`elapsed == 120 && extra > 0 && comment contains "Penalty"`)
- `player.id` → `playerApiId`
- `team.id` → `scoringTeamApiId`
- `detail` contains `"Own"` → `isOwnGoal`
- `time.elapsed + time.extra` → `scoredAt`

**Top Scorers:** All players tied at the highest goal count:
- Read `statistics[0].goals.total` from first entry as the top count
- Include all entries matching that count
- Return `SyncedTopScorer(playerApiId)`

---

## ApiSportService

Single class `com.goalcast.apisport.service.ApiSportService`. All methods. Test files split by domain.

### Methods

| Method | API endpoint | Params | Returns |
|--------|-------------|--------|---------|
| `getTournament(id, season)` | exists | — | `SyncedTournament` |
| `getTeams(leagueId, season)` | `teams` | `league`, `season` | `List<SyncedTeam>` |
| `getPlayers(teamApiId)` | `players/squads` | `team` | `List<SyncedPlayer>` |
| `getGames(leagueId, season)` | `fixtures` | `league`, `season` | `List<SyncedGame>` |
| `getGoals(fixtureId)` | `fixtures/events` | `fixture`, `type=Goal` | `List<SyncedGoal>` |
| `getTopScorers(leagueId, season)` | `players/topscorers` | `league`, `season` | `List<SyncedTopScorer>` |

Each method: calls `apiSportClient.get(...)`, passes result to corresponding mapper method, returns DTOs. No entity or repository dependencies.

---

## ApiSportSyncService Changes

After extraction, each sync method receives DTOs and only does entity persistence. N+1 fixes applied.

### Method signatures change to accept DTOs

```kotlin
fun syncTournament(synced: SyncedTournament): Tournament  // exists
fun syncTeams(teams: List<SyncedTeam>)
fun syncPlayers(teamApiId: Int, players: List<SyncedPlayer>)
fun syncGames(games: List<SyncedGame>)
fun syncGoals(gameApiId: Int, goals: List<SyncedGoal>)
fun syncTopScorers(topScorers: List<SyncedTopScorer>)
fun syncWinner()                                           // no change, DB only
fun syncGameStatuses(): List<Game>                         // stays, uses apiSportService internally
fun syncMissingGoals()                                     // stays, calls syncGoals internally
```

### N+1 fixes (from optimization audit)

**syncTeams (fix #1):**
```kotlin
fun syncTeams(teams: List<SyncedTeam>) {
    val tournament = getTournament()
    val existingTeams = teamRepository.findAll().associateBy { it.apiId }
    val existingTT = teamTournamentRepository.findByTournamentId(tournament.id)
        .associateBy { it.team.apiId }

    val teamsToSave = mutableListOf<Team>()
    val ttToSave = mutableListOf<TeamTournament>()

    for (synced in teams) {
        val team = existingTeams[synced.apiId]
            ?: Team(apiId = synced.apiId, name = synced.name)
        // ... apply fields
        teamsToSave.add(team)

        if (synced.apiId !in existingTT) {
            ttToSave.add(TeamTournament(team = team, tournament = tournament))
        }
    }

    teamRepository.saveAll(teamsToSave)
    teamTournamentRepository.saveAll(ttToSave)
}
```

**syncPlayers (fix #2):**
Pre-load `playerRepository.findAll().associateBy { it.apiId }` and `playerTournamentRepository.findByTournamentId(...)`. Batch `saveAll` per call.

**syncGames (fix #3):**
Pre-load `gameRepository.findByTournamentIdOrderByStartedAt(...).associateBy { it.apiId }`, `teamRepository.findAll().associateBy { it.apiId }`, `gameTeamRepository.findAll().groupBy { it.game.id }`. Batch `saveAll`. Track new inserts — only call `updateTournamentDates` if new games were created.

**syncGoals (fix #6):**
Pre-load relevant players: `playerRepository.findAll().associateBy { it.apiId }`.

**updateTournamentDates (fix #7):**
Replace `findByTournamentIdOrderByStartedAt` (loads all games) with two targeted queries:
```kotlin
gameRepository.findFirstByTournamentIdOrderByStartedAtAsc(tournamentId)
gameRepository.findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournamentId, "final")
```

### syncGameStatuses change (fix #9)

For the API call, `syncGameStatuses` needs to call `apiSportService`. It changes from calling `client.get("fixtures", leagueSeasonParams())` to calling `apiSportService.getGames(LEAGUE_ID, SEASON)` and working with `List<SyncedGame>` instead of `JsonNode`. The `SyncedGame` DTO already has `apiId`, `status` (as `GameStatus` enum), `homeScore`, `awayScore` — everything `syncGameStatuses` needs. Use `status.dbValue` when writing to entities.

### syncMissingGoals change

Currently calls `syncGoals(apiId: Int)` which does its own API call + JSON parsing. After extraction, it calls:
```kotlin
val goals = apiSportService.getGoals(apiId)
syncGoals(apiId, goals)
```

---

## ApiSportScheduler Changes

Orchestrates: calls `apiSportService.getX()` then `syncService.syncX()`.

```kotlin
fun syncTournament() {
    val synced = apiSportService.getTournament(LEAGUE_ID, SEASON)
    syncService.syncTournament(synced)
}

fun syncTeams() {
    val teams = apiSportService.getTeams(LEAGUE_ID, SEASON)
    syncService.syncTeams(teams)
}

fun syncPlayers() {
    val teamApiIds = syncService.getTeamApiIdsForTournament()
    for (teamApiId in teamApiIds) {
        val players = apiSportService.getPlayers(teamApiId)
        syncService.syncPlayers(teamApiId, players)
    }
}

fun syncGames() {
    val games = apiSportService.getGames(LEAGUE_ID, SEASON)
    syncService.syncGames(games)
}

fun liveSync() {
    val newlyFinished = syncService.syncGameStatuses()
    if (newlyFinished.isNotEmpty()) {
        log.info("{} games just finished, checking goals", newlyFinished.size)
    }
    syncService.syncMissingGoals()
}
```

`LEAGUE_ID` and `SEASON` constants stay in `ApiSportSyncService.companion` and are referenced by the scheduler.

`syncService.getTeamApiIdsForTournament()` is a new helper that returns the list of team API IDs for the current tournament (from `teamTournamentRepository`).

---

## Test Coverage

All in `com.goalcast.apisport` package. Unit tests only — no Spring context, no DB.

### Mapper tests (one file per domain, tests `ApiSportMapper`)

| File | Tests |
|------|-------|
| `SyncedTournamentApiSportMapperTest` | exists |
| `SyncedTeamApiSportMapperTest` | maps valid teams, handles missing/blank name, preserves nullable code/logo |
| `SyncedPlayerApiSportMapperTest` | maps valid squad, returns empty list for empty response |
| `SyncedGameApiSportMapperTest` | maps valid fixtures, phase mapping to `GamePhase` enum (GROUP/ROUND_OF_32/ROUND_OF_16/QUARTER/SEMI/FINAL/unknown→GROUP), status mapping to `GameStatus` enum (FT→FINISHED/1H→ONGOING/NS→NOT_STARTED), null scores |
| `SyncedGoalApiSportMapperTest` | maps normal goal, maps own goal, filters missed penalty, filters shootout penalty, computes scoredAt with extra time |
| `SyncedTopScorerApiSportMapperTest` | returns players tied at top, returns empty for empty response |

### Service tests (one file per domain, tests `ApiSportService`)

| File | Tests |
|------|-------|
| `SyncedTournamentApiSportServiceTest` | exists |
| `SyncedTeamApiSportServiceTest` | calls client with correct params, passes result to mapper, returns mapped DTOs |
| `SyncedPlayerApiSportServiceTest` | calls client with team ID, passes result to mapper |
| `SyncedGameApiSportServiceTest` | calls client with league+season, passes result to mapper |
| `SyncedGoalApiSportServiceTest` | calls client with fixture ID + type=Goal, passes result to mapper |
| `SyncedTopScorerApiSportServiceTest` | calls client with league+season, passes result to mapper |

Service tests follow the established pattern: mock `ApiSportClient` and `ApiSportMapper`, verify correct params, verify mapper called with client result, assert return value.

---

## Files Changed Summary

### New files
- `apisport/dto/SyncedTeam.kt`
- `apisport/dto/SyncedPlayer.kt`
- `apisport/dto/SyncedGame.kt`
- `apisport/dto/SyncedGoal.kt`
- `apisport/dto/SyncedTopScorer.kt`
- 10 test files (5 mapper + 5 service)

### Modified files
- `apisport/mapper/ApiSportMapper.kt` — add 5 mapping methods + private helpers
- `apisport/service/ApiSportService.kt` — add 5 fetch methods
- `service/ApiSportSyncService.kt` — remove JSON parsing, accept DTOs, fix N+1 queries
- `scheduler/ApiSportScheduler.kt` — orchestrate service → sync flow
- `repository/GameRepository.kt` — add `findFirst...` query methods

### Deleted
- `ApiSportSyncService.mapRoundToPhase()` — moved to mapper
- `ApiSportSyncService.mapApiStatus()` — moved to mapper
- `ApiSportSyncService.leagueSeasonParams()` — no longer needed (service handles params)
- Direct `ApiSportClient` dependency from `ApiSportSyncService` — replaced by DTOs from scheduler

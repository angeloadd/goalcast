# GoalCast — Implementation Kanban

Task breakdown organized by dependency level. Each level can start once the previous level is complete. Backend and frontend tracks run in parallel where possible — a frontend task only depends on its backend counterpart being done.

**Convention:** `B` = backend, `F` = frontend. Each task is a self-contained chunk. Subtasks within a task can be worked sequentially but the task itself is independent of other tasks at the same level.

---

## Level 0 — Infrastructure

Foundation work. No feature dependencies.

### B0.1 — Database Schema & Migrations

Set up the full database schema. All tables from the spec Section 8.

**Subtasks:**
1. Migration tooling setup (Flyway for Stack A, Laravel migrations for Stack B)
2. Core tables: `tournaments`, `teams`, `players`, `team_tournament`, `player_tournament`
3. Game tables: `games`, `game_teams`, `game_players`, `game_goals`
4. League tables: `leagues`, `league_members`
5. Prediction tables: `predictions`, `champion_predictions`
6. Ranking table: `ranks`
7. User table updates: add `is_owner` flag

### B0.2 — ApiSport HTTP Client

Base client for all ApiSport communication.

**Subtasks:**
1. HTTP client wrapper with authentication (API key header)
2. Rate limiting / retry logic (ApiSport has request limits)
3. Response parsing utilities (map API responses to internal DTOs)
4. Error handling and logging

### B0.3 — Owner Access Infrastructure

Middleware/filter that restricts access to the system owner.

**Subtasks:**
1. Owner check logic (compare authenticated user against `is_owner` flag)
2. Stack A: Spring Security filter or `@PreAuthorize` annotation. Stack B: Laravel middleware
3. Route group for `/api/owner/**` endpoints

### F0.1 — Route Structure & Guards

All routes from spec Section 3.1 and the three guards.

**Subtasks:**
1. Define all routes in the route config (public, profile, dashboard with children)
2. Implement `leagueResolverGuard` (read current league preference → redirect)
3. Implement `leagueMemberGuard` (call membership check endpoint → allow or 404)
4. `NotFoundComponent` (404 page)

### F0.2 — Layouts

The three layout shells: public, profile, dashboard.

**Subtasks:**
1. Profile layout component (minimal header: logo + username + logout)
2. Dashboard layout component (sidebar nav + header with league indicator + router outlet)
3. League indicator component (league name badge + "Change" link)
4. Wire layouts to route config (public layout already exists via landing page)

### F0.3 — League State Management

State layer for league data (Stack A: NgRx. Stack B: server-side, skip this task).

**Subtasks:**
1. `LeagueState` interface, reducer, actions (`leaguesLoadStarted`, `leaguesLoaded`, `leagueSelected`, `leagueDeselected`)
2. Effects: `leagueSelected` → write localStorage + navigate. `leagueDeselected` → clear + navigate to profile
3. Selectors: `selectLeagues`, `selectCurrentLeagueSlug`, `selectCurrentLeague`
4. Update `initUser` app initializer to load leagues and restore current league on bootstrap
5. `LeagueAdminState` — reducer, actions, effects for member management

---

## Level 1 — Tournament Data Pipeline

Backend syncs external data. Frontend has no work here — no UI depends on this directly yet.

### B1.1 — Tournament Sync

**Subtasks:**
1. `Tournament` entity/model with all fields from spec
2. Repository/DAO
3. ApiSport sync command: fetch tournaments, upsert by `api_id`
4. `GET /api/tournaments` endpoint (list available tournaments for league creation)

### B1.2 — Team Sync

**Subtasks:**
1. `Team` entity/model
2. `TeamTournament` join entity (with `is_winner` flag)
3. Repository/DAO for both
4. ApiSport sync command: fetch teams for a tournament, upsert by `api_id`, populate `TeamTournament`
5. `GET /api/tournaments/:id/teams` endpoint

### B1.3 — Player Sync

**Subtasks:**
1. `Player` entity/model (with `club_id`, `national_id` FKs)
2. `PlayerTournament` join entity (with `is_top_scorer` flag)
3. Repository/DAO for both
4. ApiSport sync command: fetch players, upsert by `api_id`, populate `PlayerTournament`
5. `GET /api/tournaments/:id/players` endpoint

### B1.4 — Game Schedule Sync

**Subtasks:**
1. `Game` entity/model (with `phase` enum and `status` enum)
2. `GameTeam` join entity (with `is_away` and `score`)
3. `GamePlayer` join entity
4. Repository/DAO for all
5. ApiSport sync command: fetch fixtures for a tournament, upsert games + team/player assignments
6. Helper: `predictable_from` calculation logic (24h before kickoff for NewGame, phase-based for OldGame)

### B1.5 — Goal Sync

**Subtasks:**
1. `GameGoal` entity/model (with `is_own_goal`, `scored_at`, `team_id`)
2. Repository/DAO
3. ApiSport sync command: fetch goals for finished/live games, upsert by game + player + minute
4. Derived helpers: `home_goals(game)`, `away_goals(game)` — filter goals by team

---

## Level 2 — League System

Depends on: Level 0 (schema), Level 1 (tournaments exist for league creation).

### B2.1 — League CRUD

**Subtasks:**
1. `League` entity/model (with `slug`, `rule_package` enum, `invite_token`)
2. Repository/DAO
3. Slug generation (URL-safe, unique, derived from name)
4. Invite token generation (UUID v4)
5. `POST /api/leagues` — create league, assign creator as admin
6. `GET /api/leagues/:slug` — league detail (for members)
7. `PUT /api/leagues/:slug` — update league name (admin only)
8. `GET /api/leagues/mine` — list user's leagues with membership info

### B2.2 — Membership Management

**Subtasks:**
1. `LeagueMember` entity/model (with `role` and `status` enums)
2. Repository/DAO
3. `GET /api/leagues/:slug/members` — list members + pending (admin only)
4. `POST /api/leagues/:slug/members/:id/approve` — approve pending request (admin only)
5. `DELETE /api/leagues/:slug/members/:id` — reject/remove member (admin only)
6. `GET /api/leagues/:slug/membership` — check current user's membership (for guard)

### B2.3 — Invitation System

**Subtasks:**
1. `POST /api/leagues/join` — resolve invite token, create pending membership
2. `POST /api/leagues/:slug/invite` — send email invitation (admin only)
3. Email template with invitation link
4. Email delivery integration (Stack A: Spring Mail or external. Stack B: Laravel Mail)

### F1.1 — Profile Hub

Depends on: F0.2 (profile layout), F0.3 (league state), B2.1 (league API).

**Subtasks:**
1. `ProfileComponent` page structure (my leagues + personal info + change password sections)
2. `LeagueCardComponent` (display league name, tournament, member count, status badge, action buttons)
3. "Enter" action: dispatch `leagueSelected`, navigate to dashboard
4. "Create League" button: navigate to `/create-league`
5. "Edit" button (admin only): open League Edit Modal
6. Personal info form (username, email) with save
7. Change password form with save

### F1.2 — Create League Page

Depends on: F0.2 (profile layout), B1.1 (tournaments API), B2.1 (create league API).

**Subtasks:**
1. `CreateLeagueComponent` with form: league name, tournament dropdown, rule package radio
2. Fetch available tournaments on init
3. Submit → call create league API → navigate to profile

### F1.3 — League Edit Modal

Depends on: F1.1 (profile hub), B2.2 (membership API), B2.3 (invitation API).

**Subtasks:**
1. Modal shell with two tabs (League Info, Members & Requests)
2. League Info tab: name input, tournament (read-only), rule package (read-only), invitation link with copy, email invite input
3. Members tab: pending requests list with approve/reject buttons, members list with role badges
4. Wire to `LeagueAdminState` for member data

---

## Level 3 — Predictions

Depends on: Level 2 (leagues exist, membership verified), Level 1 (games exist).

### B3.1 — Prediction CRUD

**Subtasks:**
1. `Prediction` entity/model
2. Repository/DAO
3. Prediction window validation:
   - NewGame: `game.started_at - 24h <= now < game.started_at`
   - OldGame: previous phase all finished AND `now < game.started_at`
4. `POST /api/leagues/:slug/predictions` — create or update prediction (upsert by user + game + league)
5. `GET /api/leagues/:slug/predictions` — current user's predictions for all games
6. Input validation: scores are non-negative integers, scorer IDs valid (player exists or 0/-1)
7. Enforce: scorer fields only accepted for NewGame knockout games, ignored otherwise

### B3.2 — Champion Predictions

**Subtasks:**
1. `ChampionPrediction` entity/model
2. Repository/DAO
3. Window validation: `tournament.started_at - 48h <= now < tournament.started_at`
4. `POST /api/leagues/:slug/champion` — create or update (upsert by user + league)
5. `GET /api/leagues/:slug/champion` — current user's champion prediction
6. `GET /api/leagues/:slug/champions` — all members' predictions (only if first game has started)
7. Enforce: only for leagues with `rule_package = new_game`

### B3.3 — Prediction Visibility

**Subtasks:**
1. `GET /api/leagues/:slug/games/:gameId/predictions` — all members' predictions for a game
2. Enforce: only return data if `game.status` is `ongoing` or `finished`
3. Before kickoff: endpoint returns 403 or empty

### F3.1 — Predictions Page

Depends on: F0.2 (dashboard layout), B1.4 (games API), B3.1 (predictions API).

**Subtasks:**
1. `PredictionsComponent` page with tabs/groups (Open, Coming Soon, Past)
2. Fetch games grouped by phase + user's existing predictions
3. Determine card state per game (open, locked, finished) based on rule package
4. Phase grouping headers (Group A, Round of 32, etc.)

### F3.2 — Match Prediction Card

Depends on: F3.1 (predictions page).

**Subtasks:**
1. Open card: stage badge, date/time, team flags + names, inline score inputs (two number inputs with `:` separator), save button
2. Saved state: checkmark indicator, inputs retain values
3. Locked card: dimmed, lock icon, "Coming Soon" badge, no inputs
4. Finished card: shows final result, clickable to detail view

### F3.3 — Scorer Prediction Input

Depends on: F3.2 (match card), B1.3 (players API).

**Subtasks:**
1. `ScorerPredictionComponent` — radio group (Specific Player / Own Goal / No Goal)
2. Conditional player dropdown when "Specific Player" selected
3. Fetch team squad from players API
4. Only rendered for NewGame leagues on knockout phase games
5. Divider line separating scorers from score inputs

### F3.4 — Match Detail View (Other Predictions)

Depends on: B3.3 (visibility API).

**Subtasks:**
1. Route or modal showing all league members' predictions for a single game
2. Table: username, predicted score, predicted sign, predicted scorers (if applicable), points earned
3. Only accessible after game kickoff
4. Sort by points earned descending

### F3.5 — Champion Predictions Page

Depends on: F0.2 (dashboard layout), B3.2 (champion API).

**Subtasks:**
1. `ChampionPredictionComponent` page
2. Before deadline: form with tournament winner dropdown + top scorer dropdown + save button
3. After deadline: read-only display of user's prediction
4. After tournament ends: show result (correct/incorrect) + bonus points
5. Section showing all members' champion predictions (after first game kicks off)
6. Sidebar nav: only show link for NewGame leagues

---

## Level 4 — Scoring & Rankings

Depends on: Level 3 (predictions exist), Level 1 (game results exist).

### B4.1 — Scoring Engines

**Subtasks:**
1. Scoring interface/contract: `calculateScore(prediction, game, rulePackage) → ScoreResult`
2. NewGame scorer: exact (4) + sign (1) + home scorer (3) + away scorer (3), stacking
3. OldGame scorer: On the Nose (3) / Goal Difference (2) / Outcome (1), highest tier only
4. `derive_sign()` helper
5. `scorer_matches()` helper (player match, no-goal check, own-goal check)
6. `correct_winner_and_goal_difference()` helper for OldGame
7. Unit tests for all scoring edge cases (draws, own goals, no goals, exact matches)

### B4.2 — Ranking Calculation

**Subtasks:**
1. `Rank` entity/model
2. Repository/DAO
3. Incremental calculation algorithm (spec Section 10.2):
   - Load existing rank (or create zeros)
   - Find predictions for newly finished games (since `calculated_from`)
   - Score each prediction using the league's rule package engine
   - Accumulate totals + tier counts
   - Track final match separately (`final_total`, `final_timestamp`)
   - Update `calculated_from`
4. Champion bonus application (spec Section 10.4): check `TeamTournament.is_winner` and `PlayerTournament.is_top_scorer`, add 15/10 points
5. Ranking sort with multi-level tiebreakers (spec Section 10.5)
6. `GET /api/leagues/:slug/ranking` endpoint

### B4.3 — Live Results & Event Chain

**Subtasks:**
1. ApiSport live results sync command (frequent polling: every 1-5 min on match days)
2. Detect game status transitions: `not_started → ongoing` (locks predictions), `ongoing → finished` (triggers ranking)
3. On `finished`: update `GameTeam.score`, sync `GameGoal` records, trigger ranking recalculation for all leagues on that tournament
4. Score update logic: read goals from API, update `GameTeam.score` for home/away

### B4.4 — Winner & Top Scorer Sync

**Subtasks:**
1. ApiSport sync command for tournament final results
2. Set `TeamTournament.is_winner = true` for the winning team
3. Set `PlayerTournament.is_top_scorer = true` for the top scorer(s)
4. Trigger champion bonus recalculation for all leagues on that tournament

### F4.1 — Rankings Page

Depends on: F0.2 (dashboard layout), B4.2 (ranking API).

**Subtasks:**
1. `RankingComponent` page with full leaderboard table
2. Columns adapt to rule package (NewGame shows scorer count + champion bonus, OldGame shows Goal Difference + Outcome counts)
3. Current user row highlighted
4. Position number column with proper ranking (ties get same position)

### F4.2 — Dashboard Home

Depends on: B4.2 (ranking API), B3.1 (predictions API), B1.4 (games API).

**Subtasks:**
1. `DashboardHomeComponent` page
2. User's rank card (position, total points)
3. Recent results widget (last N finished games with scores)
4. Upcoming predictions widget (next unpredicted open games)
5. Champion prediction status (NewGame only — submitted or not)
6. League summary (member count, tournament progress)

---

## Level 5 — Operations & Polish

Depends on: Level 4 (scoring works end-to-end).

### B5.1 — Owner Controller

**Subtasks:**
1. `POST /api/owner/sync/tournaments`
2. `POST /api/owner/sync/teams`
3. `POST /api/owner/sync/players`
4. `POST /api/owner/sync/games`
5. `POST /api/owner/sync/results`
6. `POST /api/owner/sync/goals`
7. `POST /api/owner/sync/champions`
8. `POST /api/owner/ranking/calculate` (optional `leagueId` param)
9. Each endpoint triggers the corresponding sync command and returns status

### B5.2 — Scheduled Jobs

**Subtasks:**
1. Daily schedule: tournaments, teams, players, game schedule syncs
2. Frequent schedule (match days): live results + goals sync (every 1-5 min)
3. Match day detection logic (check if any game has `started_at` today)
4. Stack A: `@Scheduled` or Spring task scheduler. Stack B: Laravel `schedule:run` in crontab

### F5.1 — Rules Page

Depends on: F0.2 (dashboard layout).

**Subtasks:**
1. `RulesComponent` page
2. Fetch league's rule package
3. Render appropriate rules display (NewGame or OldGame scoring table)
4. Clear, readable format with examples

### F5.2 — Hall of Fame

Depends on: F0.2 (dashboard layout).

**Subtasks:**
1. `HallOfFameComponent` page
2. Fetch past tournament winners (if any)
3. Display: year, tournament, winner username, points
4. Empty state when no history

### F5.3 — Post-Auth Invite Flow

Depends on: F0.1 (routes), B2.3 (join API).

**Subtasks:**
1. Preserve `?invite=TOKEN` through login/register flow
2. After auth success: detect token, POST to join endpoint
3. Navigate to profile (league appears as Pending)
4. Error handling for invalid/expired tokens

---

## Dependency Graph

```
Level 0          Level 1          Level 2          Level 3          Level 4          Level 5
─────────        ─────────        ─────────        ─────────        ─────────        ─────────
B0.1 Schema ───→ B1.1 Tourn. ──→ B2.1 League ──→ B3.1 Predict ──→ B4.1 Scoring ──→ B5.1 Owner
B0.2 ApiClient → B1.2 Teams      B2.2 Members     B3.2 Champion    B4.2 Ranking     B5.2 Schedule
B0.3 OwnerAuth   B1.3 Players    B2.3 Invite      B3.3 Visibility  B4.3 LiveSync
                  B1.4 Games                                        B4.4 WinnerSync
                  B1.5 Goals

F0.1 Routes ───→                  F1.1 Profile ──→ F3.1 Predict. ─→ F4.1 Rankings ─→ F5.1 Rules
F0.2 Layouts                      F1.2 Create Lg   F3.2 MatchCard   F4.2 Dashboard   F5.2 HallFame
F0.3 LeagueState                  F1.3 Edit Modal  F3.3 Scorer                       F5.3 InviteFlow
                                                   F3.4 Detail
                                                   F3.5 Champion
```

**Parallel tracks:** Backend and frontend at the same level can run in parallel. For example, B2.x and F1.x can be developed simultaneously — frontend can use mocked API responses until backend is ready.

**Total: 14 backend tasks, 16 frontend tasks, across 6 levels.**

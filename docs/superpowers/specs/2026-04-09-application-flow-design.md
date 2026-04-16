# GoalCast — Full Application Flow Specification

Complete specification of every user flow, system flow, data model, and business rule in GoalCast. This document is the single source of truth for the application's behavior regardless of technology stack.

**Stack references:** Where technology is mentioned, both stacks are noted:
- **Stack A:** Spring Boot (Kotlin) + Angular + PostgreSQL + Redis
- **Stack B:** Laravel (PHP) + Blade + PostgreSQL + Redis

---

## 1. Roles & Access Levels

Three distinct levels of access:

| Role | Scope | Description |
|------|-------|-------------|
| **User** | Global | Any registered, authenticated user. Can create leagues, join leagues, make predictions. |
| **League Admin** | Per-league | The user who created the league. Can edit league settings, manage members, approve/reject join requests, send invitations. One admin per league. |
| **System Owner** | Global | A single hardcoded account (not a role that can be assigned). Can trigger API syncs, force ranking recalculations, and fix data issues via a protected controller/route. |

A user can be a League Admin in one league and a regular member in another. The System Owner is also a regular user who can join and create leagues like anyone else.

---

## 2. Authentication Flow

### 2.1 Registration

1. User visits `/register`
2. Fills in: username, email, password
3. Backend validates:
   - Username is unique (max 50 characters)
   - Email is unique and valid (max 100 characters)
   - Password meets minimum strength requirements
4. Backend creates user, hashes password (Argon2)
5. User is redirected to `/login` (Stack A) or auto-logged-in (Stack B, optional)

### 2.2 Login

1. User visits `/login`
2. Fills in: email, password
3. Backend authenticates against stored hash
4. Session is created (server-side, stored in Redis)
5. Post-login redirect logic:
   a. Check for invitation token in URL query params (`?invite=TOKEN`) — if present, POST to join endpoint, then redirect to `/profile`
   b. Check for stored current league (localStorage in Stack A, session/cookie in Stack B) — if found, redirect to `/dashboard/:leagueSlug`
   c. Otherwise, redirect to `/profile`

### 2.3 Logout

1. Server session is invalidated
2. Session cookie is deleted
3. Current league preference is cleared
4. User is redirected to `/login`

### 2.4 Session Check (App Init)

On every page load / app bootstrap:
1. Call the session check endpoint (`GET /api/auth/me`)
2. If authenticated: load user data, load user's leagues, restore current league preference
3. If not authenticated: redirect to `/login` for protected routes, allow access for public routes

### 2.5 Session Constraints

- One concurrent session per user (new login invalidates previous session)
- Session stored server-side in Redis, referenced by cookie
- Session creation policy: only create when authentication succeeds (not on every request)

---

## 3. Navigation & Layout

### 3.1 Route Structure

| Path | Page | Auth Required | Layout |
|------|------|---------------|--------|
| `/` | Landing Page | No | Public |
| `/login` | Login | No | Public |
| `/register` | Register | No | Public |
| `/profile` | Profile Hub | Yes | Profile |
| `/create-league` | Create League | Yes | Profile |
| `/dashboard` | League Resolver | Yes | n/a (always redirects) |
| `/dashboard/:leagueSlug` | Dashboard Home | Yes + League Member | Dashboard |
| `/dashboard/:leagueSlug/predictions` | Predictions | Yes + League Member | Dashboard |
| `/dashboard/:leagueSlug/champion` | Champion Predictions | Yes + League Member (NewGame only) | Dashboard |
| `/dashboard/:leagueSlug/ranking` | Rankings | Yes + League Member | Dashboard |
| `/dashboard/:leagueSlug/hall-of-fame` | Hall of Fame | Yes + League Member | Dashboard |
| `/dashboard/:leagueSlug/rules` | Rules | Yes + League Member | Dashboard |
| `**` | 404 Not Found | No | Minimal |

### 3.2 Route Guards

**Auth Guard** — Checks if user is authenticated. If not, redirects to `/login`. Applied to all routes that require authentication.

**League Resolver Guard** — Applied only to bare `/dashboard`. Reads current league preference. If a slug is stored, redirects to `/dashboard/:slug`. If not, redirects to `/profile`. This route never renders a page.

**League Member Guard** — Applied to `/dashboard/:leagueSlug` and all child routes. Verifies the current user is an accepted member (Admin or Member) of the league identified by the slug. If the league doesn't exist or the user is not a member, shows the 404 page (no information leakage — unauthorized users see the same 404 whether the league exists or not).

### 3.3 Layouts

**Public Layout** — Used by: Landing, Login, Register.
- Full-width, no sidebar
- Sticky navigation bar with logo + auth links (Login / Sign Up)
- Localized (i18n support for landing page)

**Profile Layout** — Used by: Profile Hub, Create League.
- Full-width, no sidebar
- Minimal header: logo + user email/username + logout button

**Dashboard Layout** — Used by: All league-scoped pages.
- Sidebar navigation: Dashboard, Predictions, Champion Predictions (NewGame only), Rankings, Hall of Fame, Rules
- Header with league indicator: current league name badge + "Change" link (navigates back to `/profile` and clears current league preference)

### 3.4 Current League Preference

A non-sensitive convenience mechanism for remembering the user's last active league.

- **Storage:** `localStorage` (Stack A) or session/cookie (Stack B)
- **Key:** `currentLeague`, value: league slug string
- **Written on:** user selects "Enter" on a league card from the profile
- **Cleared on:** logout, or when user clicks "Change" from dashboard header
- **Read on:** app init (rehydration), post-login redirect, bare `/dashboard` route resolution

---

## 4. Landing Page

Public page introducing the application. Contains:

1. **Navigation bar** — Logo + Login / Sign Up buttons
2. **Hero section** — Headline, subtitle, call-to-action buttons (Create a League, Join an Existing League)
3. **Features section** — 4 feature cards (Predict Results, Invite Friends, Bonus Predictions, Customize Your League)
4. **How It Works section** — 4 numbered steps (Create a League, Invite Friends, Predict Scores, Climb the Ranking)
5. **CTA section** — Final call-to-action with Get Started button
6. **Footer** — Copyright, Terms, Privacy, Imprint links

Localized via compile-time i18n (Stack A: Angular `@angular/localize` with JSON translation files; Stack B: Laravel localization).

---

## 5. Profile Hub

Central page for managing league memberships and personal settings. Accessible at `/profile` after authentication.

### 5.1 My Leagues Section

Primary content area at the top of the page. Displays the user's leagues as full-width cards stacked vertically.

**League Card contents:**
- League name
- Tournament name
- Member count
- Membership status badge:
  - **Admin** (navy badge) — user created this league
  - **Member** (blue badge) — user is an accepted member
  - **Pending** (amber badge) — user requested to join, awaiting approval

**Card actions by status:**
- Admin: "Enter" button + "Edit" button (opens League Edit Modal)
- Member: "Enter" button only
- Pending: dimmed appearance, no Enter button, "Awaiting owner approval" text

**"Enter" action:** stores the league slug as the current league preference and navigates to `/dashboard/:leagueSlug`.

**"Create League" button** in the section header navigates to `/create-league`.

### 5.2 Personal Information Section

- Username and email fields with Save button
- Grid layout (2 columns on desktop)

### 5.3 Change Password Section

- Current password, new password, confirm password fields with Save button
- Grid layout (3 columns on desktop)

---

## 6. League Creation

### 6.1 Create League Flow

1. User navigates to `/create-league` from Profile Hub
2. Fills in:
   - **League name** — free text
   - **Tournament** — dropdown of available tournaments (fetched from backend, sourced from ApiSport)
   - **Rule package** — radio choice between NewGame and OldGame (see Section 9 for full rule definitions)
3. Backend creates the league and assigns the creating user as League Admin
4. User is redirected to the Profile Hub where the new league appears with Admin badge

### 6.2 League Settings (Post-Creation)

Editable by League Admin via the League Edit Modal (opened from "Edit" button on the admin's league card in Profile Hub).

**Tab 1: League Info**
- League name (editable)
- Tournament (read-only after creation)
- Rule package (read-only after creation — changing rules mid-tournament would invalidate existing rankings)

**Invitations:**
- Shareable invitation link with copy button
- Invite by email input with send button

- Save Changes button at bottom

**Tab 2: Members & Requests**

*Pending Requests* (shown at top with amber background):
- List of users who requested to join
- Each row: username, email, Accept button, Reject button
- Count in header: "Pending Requests (N)"

*Members* (below pending):
- List of current accepted members
- Each row: username, role badge (Admin / Member)
- Count in header: "Members (N)"

### 6.3 Joining a League

Two entry points, both carrying an invitation token:

1. **Shared link** — Admin copies a shareable link from the League Edit Modal. Link format: `/register?invite=TOKEN` or `/login?invite=TOKEN`
2. **Email invitation** — System sends email containing a link with the token

**Resolution flow:**
1. User follows the link → lands on `/register` or `/login` with `?invite=TOKEN` in the URL
2. User registers or logs in
3. Post-auth logic detects the token, POSTs to the join endpoint
4. Backend resolves the token to a league, creates a membership with **Pending** status
5. User is redirected to `/profile` where the league appears as Pending
6. League Admin sees the pending request in the Members & Requests tab and approves/rejects

---

## 7. Dashboard

League-scoped area. All pages within the dashboard operate in the context of the selected league (identified by the slug in the URL).

### 7.1 Dashboard Home

Overview page showing key stats for the user's current league context:

- **User's position** in the ranking (rank number, total points)
- **Recent results** — last N finished games with scores
- **Upcoming predictions** — next unpredicted games requiring attention
- **Champion prediction status** (NewGame only) — whether the user has submitted their winner/top scorer prediction
- **League summary** — member count, tournament progress (matches played / total)

### 7.2 Predictions Page

Main page for making and viewing predictions. Displays match cards with inline inputs.

**Organization:** Tabbed or grouped by tournament phase:
- **Open** — matches currently accepting predictions (based on rule package timing)
- **Upcoming / Coming Soon** — matches not yet open for predictions (shown as locked cards)
- **Past** — completed matches with results (opt-in, scrollable)

**Match Prediction Card (open for predictions):**
- Stage badge (e.g., "Group A", "Round of 32")
- Date and time
- Home team (flag + name) — score input — ":" — score input — Away team (name + flag)
- Scorer prediction section (NewGame knockout matches only, see Section 7.3)
- Save button per card (shows "Saved" checkmark when submitted)

**Match Card (locked / not yet open):**
- Dimmed appearance
- Lock icon + "Coming Soon" badge
- Teams and date shown but no inputs

**Match Card (finished):**
- Shows final result
- Clicking into a finished match opens a detail view showing all league members' predictions for that match (for large leagues, this could be an opt-in feature to avoid overwhelming the UI)

### 7.3 Scorer Predictions (NewGame Knockout Only)

Appears below the score inputs on knockout match cards, separated by a divider.

For each team (home and away), a radio group with three options:
1. **Specific Player** — reveals a dropdown of the team's squad. Player list sourced from ApiSport.
2. **Own Goal** — predicts the opposing team will score an own goal
3. **No Goal** — predicts this team won't score

The scorer prediction asks: "Who will score for [team]?" — meaning the first/primary scorer. The special values (own goal, no goal) handle edge cases.

### 7.4 Champion Predictions Page (NewGame Only)

Available only in leagues using the NewGame rule package. Accessible from the dashboard sidebar.

**Prediction window:** Opens 48 hours before the first game of the tournament. Locks at the kickoff of the first game. Can be edited any number of times before the deadline.

**Form:**
1. **Tournament Winner** — dropdown of all teams in the tournament
2. **Top Scorer** — dropdown of all players in the tournament

**After deadline:** The page becomes read-only, showing the user's prediction. After the tournament ends, it shows whether the predictions were correct and points awarded.

**Visibility:** All users' champion predictions are visible to league members after the first game kicks off (not before, to prevent copying).

### 7.5 Rankings Page

Full leaderboard for the current league.

**Columns:**
- Position (rank number)
- Username
- Total points
- Exact results count (NewGame: "On the Nose" equivalent) / On the Nose count (OldGame)
- Correct signs count (NewGame) / Goal Difference count (OldGame)
- Scorers correct count (NewGame only) / Outcome count (OldGame)
- Champion bonus points (NewGame only, shown after tournament ends)

**Sorting:** See Section 10 for ranking calculation and tiebreaker rules.

**Current user highlighting:** The logged-in user's row is visually highlighted regardless of position.

### 7.6 Hall of Fame

Displays winners of past tournaments within this league (or across the platform if there's history).

- Year, tournament name, winner username, final points
- If no past winners exist, shows an empty state message

### 7.7 Rules Page

Displays the scoring rules for the current league's rule package in a clear, readable format.

**NewGame rules display:**
- Exact score: 4 points
- Correct sign (1/x/2): 1 point (stacks with exact score)
- Correct scorer: 3 points each, home and away (knockout stage only)
- Champion bonus: correct tournament winner +15 points, correct top scorer +10 points
- Prediction window: matches open 24 hours before kickoff

**OldGame rules display:**
- On the Nose (exact score): 3 points
- Goal Difference (correct winner + correct goal difference, or any correct draw): 2 points
- Outcome (correct match winner only): 1 point
- Only the highest matching tier counts (no stacking)
- No scorer predictions, no champion predictions
- Prediction window: all matches in a phase open simultaneously

---

## 8. Data Model

### 8.1 Core Entities

**User**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| username | string(50) | Unique |
| email | string(100) | Unique |
| password | string | Hashed (Argon2) |
| is_owner | boolean | Hardcoded system owner flag |
| created_at | timestamp | |
| updated_at | timestamp | |

**Tournament**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| api_id | integer | External ID from ApiSport |
| name | string | e.g., "FIFA World Cup 2026" |
| country | string | |
| logo | string | URL to tournament logo |
| season | integer | e.g., 2026 |
| is_cup | boolean | Cup format (vs league format) |
| started_at | timestamp | First game kickoff |
| final_started_at | timestamp | When knockout/final phase begins |
| created_at | timestamp | |
| updated_at | timestamp | |

**Team**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| api_id | integer | External ID from ApiSport |
| name | string | |
| code | string | Short code (e.g., "GER") |
| logo | string | URL to team crest |
| is_national | boolean | National team vs club team |
| created_at | timestamp | |
| updated_at | timestamp | |

**Player**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| api_id | integer | External ID from ApiSport |
| displayed_name | string | Name shown in UI |
| first_name | string | |
| last_name | string | |
| club_id | FK → Team | Nullable. Club team the player belongs to |
| national_id | FK → Team | Nullable. National team the player belongs to |
| created_at | timestamp | |
| updated_at | timestamp | |

*Constraint:* `club_id` and `national_id` must not reference the same team.

**Game**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| tournament_id | FK → Tournament | |
| stage | string | e.g., "Group A", "Round of 32", "Quarter-Final", "Semi-Final", "Final" |
| phase | enum | `group`, `round_of_32`, `round_of_16`, `quarter`, `semi`, `final` |
| status | enum | `not_started`, `ongoing`, `finished` |
| started_at | timestamp | Kickoff time |
| created_at | timestamp | |
| updated_at | timestamp | |

**GameTeam** (join table)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| game_id | FK → Game | |
| team_id | FK → Team | |
| is_away | boolean | false = home team, true = away team |
| score | integer | Nullable. Final score for this team in this game |

**GamePlayer** (join table — players participating in a game)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| game_id | FK → Game | |
| player_id | FK → Player | |

**GameGoal**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| game_id | FK → Game | |
| player_id | FK → Player | Who scored |
| team_id | FK → Team | Which team was credited the goal |
| is_own_goal | boolean | Own goal flag |
| scored_at | integer | Nullable. Minute of the goal |

**TeamTournament** (join table)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| team_id | FK → Team | |
| tournament_id | FK → Tournament | |
| is_winner | boolean | Set to true when tournament concludes |

**PlayerTournament** (join table)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| player_id | FK → Player | |
| tournament_id | FK → Tournament | |
| is_top_scorer | boolean | Set to true when tournament concludes |

### 8.2 League Entities

**League**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| name | string | |
| slug | string | Unique. URL-safe identifier, generated from name |
| tournament_id | FK → Tournament | Immutable after creation |
| rule_package | enum | `new_game`, `old_game` — immutable after creation |
| invite_token | string | Unique. Used for shareable invitation links |
| created_at | timestamp | |
| updated_at | timestamp | |

**LeagueMember** (join table)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| league_id | FK → League | |
| user_id | FK → User | |
| role | enum | `admin`, `member` |
| status | enum | `pending`, `accepted` |
| created_at | timestamp | |

*Constraint:* unique on (league_id, user_id).

### 8.3 Prediction Entities

**Prediction**
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| user_id | FK → User | |
| game_id | FK → Game | |
| league_id | FK → League | |
| home_score | integer | Predicted home team score |
| away_score | integer | Predicted away team score |
| home_scorer_id | integer | Nullable. Player ID, 0 = no goal, -1 = own goal. Only for NewGame knockout. |
| away_scorer_id | integer | Nullable. Same encoding as home_scorer_id |
| created_at | timestamp | |
| updated_at | timestamp | |

*Constraint:* unique on (user_id, game_id, league_id).

**Derived field (not stored):** `sign` — computed from home_score and away_score:
- home_score > away_score → `'1'` (home win)
- home_score == away_score → `'x'` (draw)
- home_score < away_score → `'2'` (away win)

**ChampionPrediction** (NewGame only)
| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| user_id | FK → User | |
| league_id | FK → League | |
| team_id | FK → Team | Predicted tournament winner |
| player_id | FK → Player | Predicted top scorer |
| created_at | timestamp | |
| updated_at | timestamp | |

*Constraint:* unique on (user_id, league_id). One champion prediction per user per league.

### 8.4 Ranking Entity

**Rank** — a materialized/cached ranking record, updated incrementally.

| Field | Type | Notes |
|-------|------|-------|
| id | PK | |
| user_id | FK → User | |
| league_id | FK → League | |
| total | integer | Cumulative total points |
| tier1_count | integer | NewGame: exact results. OldGame: On the Nose. |
| tier2_count | integer | NewGame: correct scorers. OldGame: Goal Difference. |
| tier3_count | integer | NewGame: correct signs. OldGame: Outcome. |
| final_total | integer | Points scored on the final match (tiebreaker) |
| final_timestamp | timestamp | Nullable. When the user submitted their final match prediction (tiebreaker) |
| winner_bonus | boolean | Did user correctly predict tournament winner |
| top_scorer_bonus | boolean | Did user correctly predict top scorer |
| calculated_from | timestamp | Nullable. The `started_at` of the latest game included in this calculation |
| created_at | timestamp | |
| updated_at | timestamp | |

*Constraint:* unique on (user_id, league_id).

---

## 9. Rule Packages

### 9.1 NewGame

**Scoring per game:**

| Outcome | Points | Stacking |
|---------|--------|----------|
| Exact score (home AND away match) | 4 | Yes — sign point always added if result is correct |
| Correct sign (1/x/2) | 1 | Base point, awarded independently |
| Correct home scorer | 3 | Knockout stage only |
| Correct away scorer | 3 | Knockout stage only |

Maximum per group game: **5 pts** (4 exact + 1 sign)
Maximum per knockout game: **11 pts** (4 exact + 1 sign + 3 home scorer + 3 away scorer)

**Champion predictions:**
- Correct tournament winner: **+15 pts**
- Correct top scorer: **+10 pts**
- Both locked at kickoff of first game
- Bonus applied to ranking after tournament concludes

**Prediction window:**
- Each match opens for predictions **24 hours** before its kickoff time
- Predictions lock at kickoff
- Users can create, edit, or delete predictions any number of times before the deadline

**Scorer validation:**
- Scorer predictions are only available for knockout stage games
- Valid values: a player ID from the team's squad, `0` (no goal), `-1` (own goal)
- The squad list is sourced from ApiSport

### 9.2 OldGame

**Scoring per game — tiered, highest matching tier only:**

| Tier | Name | Condition | Points |
|------|------|-----------|--------|
| 1 | On the Nose | Exact score matches (e.g., predicted 3:1, result 3:1) | 3 |
| 2 | Goal Difference | Correct winner AND correct goal difference (e.g., predicted 2:0, result 3:1 — both home win, both +2 difference). For draws: any correct draw (e.g., predicted 0:0, result 2:2 — both draws, same 0 difference). | 2 |
| 3 | Outcome | Correct match winner but wrong goal difference (e.g., predicted 1:0, result 3:1). | 1 |

**Important:** For draws, only On the Nose and Goal Difference tiers apply. Since all draws have the same "outcome" (draw), and Goal Difference already covers any correct draw, the Outcome tier is only meaningful for non-draw results.

**No scorer predictions.** No champion predictions.

Maximum per game: **3 pts**.

**Prediction window:**
- All matches in a phase open simultaneously:
  - All group stage games open when the tournament begins (or a configured time before)
  - All Round of 32 games open when the group stage concludes
  - All Round of 16 games open when the Round of 32 concludes
  - And so on for each subsequent phase
- Predictions still lock at each individual game's kickoff time
- Users can create, edit, or delete predictions any number of times before the per-game deadline

### 9.3 Rule Package Comparison

| Aspect | NewGame | OldGame |
|--------|---------|---------|
| Scoring model | Additive (stacking) | Tiered (highest only) |
| Max points per group game | 5 | 3 |
| Max points per knockout game | 11 | 3 |
| Scorer predictions | Knockout only | No |
| Champion predictions | Yes (winner + top scorer) | No |
| Prediction window | 24h before each game | Entire phase at once |
| Complexity | Higher | Simpler |
| Catch-up potential | High (knockout escalation + champion bonus) | Lower (flat scoring) |

---

## 10. Ranking Calculation

### 10.1 Calculation Trigger

Rankings are recalculated:
- **Automatically** when a game's status changes to `finished` (triggered by ApiSport sync detecting a final whistle)
- **Manually** by the System Owner via the owner controller

Calculation is performed **per league** — each league has independent rankings.

### 10.2 Incremental Calculation

Rankings are not recalculated from scratch each time. The `calculated_from` field on the Rank record tracks the `started_at` timestamp of the most recent game included in the last calculation.

**Algorithm:**

```
For each user in the league:
  1. Load the user's existing Rank record (or create one with all zeros)
  2. Find all predictions where:
     - game.status == 'finished'
     - game.started_at > rank.calculated_from (only new results)
  3. For each prediction, compute the score based on the league's rule package
  4. Add the new scores to the existing cumulative totals
  5. Update calculated_from to the latest finished game's started_at
  6. If the game is the Final, store the prediction score as final_total
     and the prediction's created_at as final_timestamp
```

### 10.3 Per-Prediction Scoring

**NewGame scoring:**

```
sign = derive_sign(prediction.home_score, prediction.away_score)
game_sign = derive_sign(game.home_score, game.away_score)

points = 0
if prediction.home_score == game.home_score AND prediction.away_score == game.away_score:
    points += 4  // exact result
    tier1_count += 1
if sign == game_sign:
    points += 1  // correct sign
    tier3_count += 1
if game.phase is knockout:
    if scorer_matches(prediction.home_scorer_id, game.home_goals):
        points += 3
        tier2_count += 1
    if scorer_matches(prediction.away_scorer_id, game.away_goals):
        points += 3
        tier2_count += 1
```

**Scorer matching logic:**
- If `scorer_id == 0` (no goal): correct if the team scored 0 goals
- If `scorer_id == -1` (own goal): correct if any goal for that team was an own goal
- If `scorer_id > 0` (player): correct if that player scored any goal for that team (including checking the actual goals list from ApiSport)

**OldGame scoring:**

```
if prediction.home_score == game.home_score AND prediction.away_score == game.away_score:
    points = 3  // On the Nose
    tier1_count += 1
else if correct_winner_and_goal_difference(prediction, game):
    points = 2  // Goal Difference
    tier2_count += 1
else if derive_sign(prediction) == derive_sign(game):
    points = 1  // Outcome
    tier3_count += 1
else:
    points = 0
```

**Goal Difference matching logic:**

```
function correct_winner_and_goal_difference(prediction, game):
    pred_diff = prediction.home_score - prediction.away_score
    game_diff = game.home_score - game.away_score
    pred_sign = derive_sign(prediction)
    game_sign = derive_sign(game)
    return pred_sign == game_sign AND pred_diff == game_diff
```

Note: for draws, the goal difference is always 0. So if the prediction is a draw and the result is a draw, the goal differences match (both 0). This means any correct draw prediction that isn't the exact score qualifies as Goal Difference. For example: predicted 0:0, result 2:2 → Goal Difference (2 pts). Predicted 2:2, result 2:2 → On the Nose (3 pts).

### 10.4 Champion Bonus (NewGame Only)

Applied after the tournament concludes (all games finished):

```
For each user with a ChampionPrediction in this league:
  if user.champion_prediction.team_id matches the tournament winner (team_tournament.is_winner == true):
      rank.total += 15
      rank.winner_bonus = true
  if user.champion_prediction.player_id matches the top scorer (player_tournament.is_top_scorer == true):
      rank.total += 10
      rank.top_scorer_bonus = true
```

The winner and top scorer are determined by data from ApiSport (synced by the `fetch-champions` job or manually triggered), stored as flags on `TeamTournament.is_winner` and `PlayerTournament.is_top_scorer`. **These are never hardcoded** — they are data-driven, resolved by the sync process.

### 10.5 Ranking Sort Order (Tiebreakers)

Rankings are sorted by the following criteria, in order. Each level is a tiebreaker for the previous:

| Priority | Field | Direction | Description |
|----------|-------|-----------|-------------|
| 1 | total | Descending | Cumulative points |
| 2 | tier1_count | Descending | Exact results (NewGame) / On the Nose (OldGame) |
| 3 | tier2_count | Descending | Correct scorers (NewGame) / Goal Difference (OldGame) |
| 4 | tier3_count | Descending | Correct signs (NewGame) / Outcome (OldGame) |
| 5 | final_total | Descending | Points from the Final match |
| 6 | final_timestamp | Ascending | Earlier prediction of the Final wins |
| 7 | username | Ascending | Alphabetical (last resort) |

---

## 11. ApiSport Integration

### 11.1 Overview

GoalCast relies on ApiSport as its external data source for all tournament, team, player, and match data. The application does not manage this data manually — it syncs from the API on a schedule and stores the data locally.

Each entity has an `api_id` field mapping it to the ApiSport identifier.

### 11.2 Sync Operations

| Operation | What it syncs | Schedule | Notes |
|-----------|--------------|----------|-------|
| **Tournaments** | Tournament metadata (name, country, logo, season, dates) | Daily or on-demand | Infrequent changes. Picks up date corrections. |
| **Teams** | Teams participating in a tournament, including roster changes | Daily | Detects squad changes before and during tournament. |
| **Players** | Player data (names, club/national affiliations) | Daily | Tracks transfers, squad updates. |
| **Game Schedule** | Upcoming games, kickoff times, team assignments | Daily | Picks up schedule changes, postponements. |
| **Live Results** | Game status (not_started → ongoing → finished), scores | Frequent during match days (every 1-5 minutes) | Drives the prediction lock (game goes to `ongoing`) and ranking trigger (game goes to `finished`). |
| **Goals** | Goal scorers, own goals, minute of goal | Frequent during match days | Updates GameGoal records. Used for scorer prediction matching. |
| **Winner & Top Scorer** | Tournament winner flag, top scorer flag | End of tournament (on-demand or scheduled) | Sets `TeamTournament.is_winner` and `PlayerTournament.is_top_scorer`. Triggers champion bonus calculation. |

### 11.3 Sync Triggers

**Scheduled jobs:**
- A background scheduler runs each sync operation on its configured interval
- Stack A: Spring `@Scheduled` tasks or similar
- Stack B: Laravel scheduled commands via `schedule:run`

**Manual triggers (System Owner only):**
- A protected controller/route group accessible only by the System Owner account
- Endpoints to trigger any sync operation on demand
- Used for error recovery, data corrections, or forcing a re-sync

### 11.4 Event Chain

When the Live Results sync detects a game has finished:

```
ApiSport sync detects game.status changed to 'finished'
  → Update local Game record (status, scores)
  → Update GameGoal records (scorers, own goals)
  → Trigger ranking recalculation for ALL leagues that reference this game's tournament
  → Rankings are updated incrementally (Section 10.2)
```

### 11.5 Owner Controller

Protected endpoints accessible only by the System Owner:

| Endpoint | Description |
|----------|-------------|
| `POST /api/owner/sync/tournaments` | Trigger tournament data sync |
| `POST /api/owner/sync/teams` | Trigger team data sync |
| `POST /api/owner/sync/players` | Trigger player data sync |
| `POST /api/owner/sync/games` | Trigger game schedule sync |
| `POST /api/owner/sync/results` | Trigger live results sync |
| `POST /api/owner/sync/goals` | Trigger goals sync |
| `POST /api/owner/sync/champions` | Trigger winner/top scorer sync |
| `POST /api/owner/ranking/calculate` | Trigger ranking recalculation (optionally for a specific league) |

---

## 12. API Endpoints Summary

### 12.1 Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login, create session |
| `POST` | `/api/auth/logout` | Yes | Logout, destroy session |
| `GET` | `/api/auth/me` | Yes | Get current user info |

### 12.2 Leagues

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues/mine` | Yes | User's leagues with membership status |
| `POST` | `/api/leagues` | Yes | Create new league |
| `GET` | `/api/leagues/:slug` | Member | League detail |
| `PUT` | `/api/leagues/:slug` | Admin | Update league settings |
| `GET` | `/api/leagues/:slug/members` | Admin | Members + pending requests |
| `POST` | `/api/leagues/:slug/invite` | Admin | Send email invitation |
| `POST` | `/api/leagues/:slug/members/:id/approve` | Admin | Approve join request |
| `DELETE` | `/api/leagues/:slug/members/:id` | Admin | Reject join request / remove member |
| `GET` | `/api/leagues/:slug/membership` | Yes | Check current user's membership (for guard) |
| `POST` | `/api/leagues/join` | Yes | Join league via invitation token |

### 12.3 Predictions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues/:slug/games` | Member | Games for the league's tournament, grouped by phase |
| `GET` | `/api/leagues/:slug/predictions` | Member | Current user's predictions |
| `POST` | `/api/leagues/:slug/predictions` | Member | Create/update prediction for a game |
| `GET` | `/api/leagues/:slug/games/:gameId/predictions` | Member | All members' predictions for a game (only after kickoff) |

### 12.4 Champion Predictions (NewGame Only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues/:slug/champion` | Member | Current user's champion prediction |
| `POST` | `/api/leagues/:slug/champion` | Member | Create/update champion prediction |
| `GET` | `/api/leagues/:slug/champions` | Member | All members' champion predictions (only after first game kickoff) |

### 12.5 Rankings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues/:slug/ranking` | Member | Full leaderboard |

### 12.6 Reference Data

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/tournaments` | Yes | Available tournaments (for league creation) |
| `GET` | `/api/tournaments/:id/teams` | Yes | Teams in a tournament |
| `GET` | `/api/tournaments/:id/players` | Yes | Players in a tournament |

### 12.7 Owner (System Owner Only)

See Section 11.5.

---

## 13. State Management

Applicable primarily to Stack A (Angular + NgRx). Stack B (Laravel + Blade) manages state server-side via sessions and database queries.

### 13.1 Auth State

```
AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
```

Actions: login/register/logout started/succeeded/failed, session check started/succeeded/failed.

### 13.2 League State

```
LeagueState {
  leagues: LeagueWithMembership[]   // user's leagues with role/status
  currentLeagueSlug: string | null  // synced with localStorage
  loading: boolean
  error: string | null
}
```

Actions: leagues load started/loaded/failed, league selected/deselected.

Effects: `leagueSelected` writes to localStorage and navigates to dashboard. `leagueDeselected` clears localStorage and navigates to profile.

### 13.3 League Admin State

```
LeagueAdminState {
  members: Member[]
  pendingRequests: JoinRequest[]
  loading: boolean
  error: string | null
}
```

Actions: members load started/loaded, request approved/rejected, invite sent.

### 13.4 App Initialization

On bootstrap:
1. Check session (`GET /api/auth/me`)
2. If authenticated: dispatch auth success, load user's leagues
3. Restore current league from localStorage (if still a member)

---

## 14. Prediction Lifecycle

The complete lifecycle of a prediction from creation to scoring:

### 14.1 States

```
[Not Available] → [Open] → [Locked] → [Live] → [Scored]
```

| State | Condition | User can... |
|-------|-----------|-------------|
| **Not Available** | Before the prediction window opens | See the match as "Coming Soon" (locked card) |
| **Open** | Within prediction window, before kickoff | Create, edit, delete predictions |
| **Locked** | Game status changed to `ongoing` (kickoff) | View own prediction (read-only) |
| **Live** | Game is in progress | View own prediction. Other members' predictions now visible. |
| **Scored** | Game status changed to `finished` | View own prediction + result + points earned. All predictions visible. |

### 14.2 Prediction Window Rules

**NewGame:** Each game opens individually, 24 hours before its `started_at` timestamp. Locks at `started_at`.

**OldGame:** All games in a phase open simultaneously when the previous phase concludes. Each game still locks individually at its own `started_at`.

Phase transition logic for OldGame:
- Group stage games: open at a configured time before tournament start (e.g., 48h before first game)
- Round of 32 games: open when all group stage games are `finished`
- Round of 16 games: open when all Round of 32 games are `finished`
- Quarter-final games: open when all Round of 16 games are `finished`
- Semi-final games: open when all quarter-final games are `finished`
- Final: opens when all semi-final games are `finished`

### 14.3 Visibility Rules

- Before kickoff: a user can only see their own prediction
- After kickoff: all league members' predictions for that game become visible
- This prevents copying and encourages independent thinking

### 14.4 Champion Prediction Window (NewGame Only)

- Opens: 48 hours before the first game's `started_at`
- Locks: at the first game's `started_at`
- Editable any number of times before deadline
- All champion predictions visible to league members after the first game kicks off

---

## 15. Invitation System

### 15.1 Token Generation

When a league is created, a unique invitation token is generated and stored on the League record. This token is used for both shareable links and email invitations.

### 15.2 Shareable Link

Format: `{base_url}/register?invite={token}` (or `/login?invite={token}` for existing users)

The League Admin can copy this link from the League Edit Modal.

### 15.3 Email Invitation

The League Admin enters an email address in the League Edit Modal. The system sends an email containing the invitation link. The email delivery mechanism is implementation-specific (Stack A: Spring Mail or external service; Stack B: Laravel Mail).

### 15.4 Token Resolution

1. User arrives at `/register?invite=TOKEN` or `/login?invite=TOKEN`
2. The token is preserved through the auth flow (stored in URL params or session)
3. After successful authentication, the frontend POSTs to `/api/leagues/join` with the token
4. Backend resolves the token to a league
5. A LeagueMember record is created with status `pending`
6. User is redirected to `/profile` where the league appears as Pending
7. League Admin approves or rejects the request

### 15.5 Security Considerations

- Tokens should be long, random, and unguessable (e.g., UUID v4 or similar)
- A token maps to exactly one league
- Using a token does not grant immediate access — membership starts as Pending
- Invalid or expired tokens should show a clear error message

---

## 16. Localization

The application supports multiple languages. Currently: English (default) and Italian.

**Landing page:** Localized via compile-time i18n with JSON translation files.

**Application pages:** Localization strategy for authenticated pages (profile, dashboard, predictions) is to be determined — can follow the same compile-time approach or use a runtime approach depending on requirements.

**Locale detection:** A `gclocale` cookie is set by the backend. If the cookie is absent or set to `en`, the default English locale is used. The locale can be changed via the locale API endpoint.
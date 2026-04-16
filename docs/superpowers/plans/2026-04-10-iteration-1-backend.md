# Iteration 1 — Backend Reference Spec

> **Status: REFERENCE DOCUMENT.** This is a high-level reference for the full backend scope. Execution happens via fine-grained plans in separate files.

**Goal:** Build the complete backend for a single-league NewGame prediction app: ApiSport data sync, prediction CRUD with activation gate, champion predictions, and ranking via PostgreSQL view.

**Architecture:** Spring Boot REST API serving an Angular SPA. Single implicit league — no league entity. Every authenticated user can read data; only activated users (`is_active = true`, set manually in DB) can submit predictions. ApiSport integration pulls tournament/team/player/game data. Ranking is computed live by a PostgreSQL view — no application-side scoring engine or ranking service needed.

**Tech Stack:** Spring Boot 4.0.3, Kotlin 2.2.21, PostgreSQL 17, Flyway, Spring Security, Spring Session (Redis/Valkey), JPA/Hibernate, RestClient, JUnit 5, MockK, AssertJ

**Existing codebase:**
- Auth already works (login, register, logout, session check)
- Entities: `User` only
- Migration: `V1__create_users_table.sql`
- Test pattern: `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` with H2, unit tests with MockK
- Config: `application.yml` (PostgreSQL, Redis, Flyway), `application-test.yml` (H2, no Flyway, no Redis)

**API surface (what the frontend will consume):**

| Method | Path | Auth | Activation | Description |
|--------|------|------|------------|-------------|
| GET | `/api/auth/me` | Yes | — | Returns user info + `isActive` flag |
| GET | `/api/games` | Yes | — | All games with teams, scores, user's prediction status |
| GET | `/api/games/:id` | Yes | — | Game detail with goals |
| GET | `/api/games/:id/predictions` | Yes | — | All users' predictions (only after kickoff) |
| GET | `/api/predictions` | Yes | — | Current user's all predictions |
| POST | `/api/predictions` | Yes | Required | Create/update prediction |
| GET | `/api/champion` | Yes | — | Current user's champion prediction |
| POST | `/api/champion` | Yes | Required | Create/update champion prediction |
| GET | `/api/champions` | Yes | — | All users' champion predictions (after first kickoff) |
| GET | `/api/ranking` | Yes | — | Full ranking table |
| GET | `/api/tournaments/current` | Yes | — | Current tournament with teams and players |

---

## File Structure

```
src/main/kotlin/com/goalcast/
├── GoalCastApplication.kt                    (modify: add @ConfigurationPropertiesScan)
├── client/
│   └── ApiSportClient.kt                     (create: HTTP client for ApiSport)
├── config/
│   ├── ApiSportConfig.kt                     (create: RestClient bean + properties)
│   └── WebSecurityConfig.kt                  (existing, no changes)
├── controller/
│   ├── AuthController.kt                     (modify: return isActive in UserDto)
│   ├── ChampionController.kt                 (create)
│   ├── GameController.kt                     (create)
│   ├── PredictionController.kt               (create)
│   ├── RankingController.kt                  (create)
│   └── TournamentController.kt               (create)
├── dto/
│   ├── UserDto.kt                            (modify: add isActive field)
│   ├── request/
│   │   ├── PredictionRequest.kt              (create)
│   │   └── ChampionRequest.kt                (create)
│   └── response/
│       ├── GameResponse.kt                   (create)
│       ├── GameDetailResponse.kt             (create)
│       ├── PredictionResponse.kt             (create)
│       ├── ChampionResponse.kt               (create)
│       ├── RankingResponse.kt                (create)
│       └── TournamentResponse.kt             (create)
├── entity/
│   ├── User.kt                               (modify: add isActive)
│   ├── Tournament.kt                         (create)
│   ├── Team.kt                               (create)
│   ├── Player.kt                             (create)
│   ├── Game.kt                               (create)
│   ├── GameTeam.kt                           (create)
│   ├── GameGoal.kt                           (create)
│   ├── TeamTournament.kt                     (create)
│   ├── PlayerTournament.kt                   (create)
│   ├── Prediction.kt                         (create)
│   ├── ChampionPrediction.kt                 (create)
│   └── RankingEntry.kt                       (create: read-only entity mapped to ranking_view)
├── repository/
│   ├── UserRepository.kt                     (existing, no changes)
│   ├── TournamentRepository.kt               (create)
│   ├── TeamRepository.kt                     (create)
│   ├── PlayerRepository.kt                   (create)
│   ├── GameRepository.kt                     (create)
│   ├── GameTeamRepository.kt                 (create)
│   ├── GameGoalRepository.kt                 (create)
│   ├── TeamTournamentRepository.kt           (create)
│   ├── PlayerTournamentRepository.kt         (create)
│   ├── PredictionRepository.kt               (create)
│   ├── ChampionPredictionRepository.kt       (create)
│   └── RankingRepository.kt                  (create: reads from ranking_view)
├── service/
│   ├── UserService.kt                        (existing, no changes)
│   ├── CustomUserDetailsService.kt           (existing, no changes)
│   ├── ApiSportSyncService.kt                (create: orchestrates all sync operations)
│   └── PredictionService.kt                  (create)
└── exception/
    └── GlobalExceptionHandler.kt             (existing, no changes)

src/main/resources/
├── application.yml                           (modify: add apisport config)
└── db/migration/
    ├── V1__create_users_table.sql            (modify: add is_active column)
    ├── V2__create_tournament_tables.sql      (create)
    ├── V3__create_game_tables.sql            (create)
    ├── V4__create_prediction_tables.sql      (create)
    └── V5__create_ranking_view.sql           (create)

src/test/kotlin/com/goalcast/
├── service/
│   └── PredictionServiceTest.kt              (create)
└── controller/
    ├── GameControllerTest.kt                 (create)
    ├── PredictionControllerTest.kt           (create)
    ├── ChampionControllerTest.kt             (create)
    └── RankingControllerTest.kt              (create)
```

---

## Task 1: Database Migrations

**Files:**
- Create: `src/main/resources/db/migration/V2__create_tournament_tables.sql`
- Create: `src/main/resources/db/migration/V3__create_game_tables.sql`
- Create: `src/main/resources/db/migration/V4__create_prediction_tables.sql`
- Create: `src/main/resources/db/migration/V5__add_user_is_active.sql`

- [ ] **Step 1: Write V2 — tournament, team, player tables**

```sql
-- V2__create_tournament_tables.sql

CREATE TABLE tournaments (
    id              BIGSERIAL PRIMARY KEY,
    api_id          INTEGER NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    country         VARCHAR(100),
    logo            VARCHAR(500),
    season          INTEGER NOT NULL,
    is_cup          BOOLEAN NOT NULL DEFAULT FALSE,
    started_at      TIMESTAMP,
    final_started_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE teams (
    id          BIGSERIAL PRIMARY KEY,
    api_id      INTEGER NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(10),
    logo        VARCHAR(500),
    is_national BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE players (
    id              BIGSERIAL PRIMARY KEY,
    api_id          INTEGER NOT NULL UNIQUE,
    displayed_name  VARCHAR(255) NOT NULL,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    club_id         BIGINT REFERENCES teams(id),
    national_id     BIGINT REFERENCES teams(id),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_club_national_differ CHECK (club_id IS NULL OR national_id IS NULL OR club_id <> national_id)
);

CREATE TABLE team_tournaments (
    id              BIGSERIAL PRIMARY KEY,
    team_id         BIGINT NOT NULL REFERENCES teams(id),
    tournament_id   BIGINT NOT NULL REFERENCES tournaments(id),
    is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_team_tournament UNIQUE (team_id, tournament_id)
);

CREATE TABLE player_tournaments (
    id              BIGSERIAL PRIMARY KEY,
    player_id       BIGINT NOT NULL REFERENCES players(id),
    tournament_id   BIGINT NOT NULL REFERENCES tournaments(id),
    is_top_scorer   BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_player_tournament UNIQUE (player_id, tournament_id)
);

CREATE INDEX idx_tournaments_api_id ON tournaments (api_id);
CREATE INDEX idx_teams_api_id ON teams (api_id);
CREATE INDEX idx_players_api_id ON players (api_id);
CREATE INDEX idx_players_national_id ON players (national_id);
```

- [ ] **Step 2: Write V3 — game tables**

```sql
-- V3__create_game_tables.sql

CREATE TABLE games (
    id              BIGSERIAL PRIMARY KEY,
    api_id          INTEGER UNIQUE,
    tournament_id   BIGINT NOT NULL REFERENCES tournaments(id),
    stage           VARCHAR(100) NOT NULL,
    phase           VARCHAR(20) NOT NULL CHECK (phase IN ('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'final')),
    status          VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'finished')),
    started_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE game_teams (
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT NOT NULL REFERENCES games(id),
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    is_away     BOOLEAN NOT NULL DEFAULT FALSE,
    score       INTEGER,
    CONSTRAINT uq_game_team UNIQUE (game_id, team_id)
);

CREATE TABLE game_goals (
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT NOT NULL REFERENCES games(id),
    player_id   BIGINT NOT NULL REFERENCES players(id),
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    is_own_goal BOOLEAN NOT NULL DEFAULT FALSE,
    scored_at   INTEGER
);

CREATE INDEX idx_games_tournament_id ON games (tournament_id);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_started_at ON games (started_at);
CREATE INDEX idx_game_teams_game_id ON game_teams (game_id);
CREATE INDEX idx_game_goals_game_id ON game_goals (game_id);
```

- [ ] **Step 3: Write V4 — prediction and champion prediction tables**

```sql
-- V4__create_prediction_tables.sql

CREATE TABLE predictions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    game_id         BIGINT NOT NULL REFERENCES games(id),
    home_score      INTEGER NOT NULL,
    away_score      INTEGER NOT NULL,
    home_scorer_id  INTEGER,
    away_scorer_id  INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_prediction UNIQUE (user_id, game_id)
);

CREATE TABLE champion_predictions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    team_id     BIGINT NOT NULL REFERENCES teams(id),
    player_id   BIGINT NOT NULL REFERENCES players(id),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_predictions_user_id ON predictions (user_id);
CREATE INDEX idx_predictions_game_id ON predictions (game_id);
```

- [ ] **Step 4: Write V5 — ranking view**

```sql
-- V5__create_ranking_view.sql

CREATE VIEW ranking_view AS
WITH prediction_scores AS (
    SELECT
        p.user_id,
        CASE WHEN p.home_score = gth.score AND p.away_score = gta.score THEN 1 ELSE 0 END AS is_exact,
        CASE WHEN sign(p.home_score - p.away_score) = sign(gth.score - gta.score) THEN 1 ELSE 0 END AS is_sign,
        CASE
            WHEN g.phase = 'group' THEN 0
            WHEN p.home_scorer_id = 0 AND gth.score = 0 THEN 1
            WHEN p.home_scorer_id = -1 AND EXISTS (
                SELECT 1 FROM game_goals gg
                WHERE gg.game_id = g.id AND gg.team_id = gth.team_id AND gg.is_own_goal = TRUE
            ) THEN 1
            WHEN p.home_scorer_id > 0 AND EXISTS (
                SELECT 1 FROM game_goals gg
                JOIN players pl ON pl.id = gg.player_id
                WHERE gg.game_id = g.id AND gg.team_id = gth.team_id
                  AND gg.is_own_goal = FALSE AND pl.api_id = p.home_scorer_id
            ) THEN 1
            ELSE 0
        END AS is_home_scorer,
        CASE
            WHEN g.phase = 'group' THEN 0
            WHEN p.away_scorer_id = 0 AND gta.score = 0 THEN 1
            WHEN p.away_scorer_id = -1 AND EXISTS (
                SELECT 1 FROM game_goals gg
                WHERE gg.game_id = g.id AND gg.team_id = gta.team_id AND gg.is_own_goal = TRUE
            ) THEN 1
            WHEN p.away_scorer_id > 0 AND EXISTS (
                SELECT 1 FROM game_goals gg
                JOIN players pl ON pl.id = gg.player_id
                WHERE gg.game_id = g.id AND gg.team_id = gta.team_id
                  AND gg.is_own_goal = FALSE AND pl.api_id = p.away_scorer_id
            ) THEN 1
            ELSE 0
        END AS is_away_scorer,
        g.phase,
        p.created_at AS prediction_created_at
    FROM predictions p
    JOIN games g ON g.id = p.game_id
    JOIN game_teams gth ON gth.game_id = g.id AND gth.is_away = FALSE
    JOIN game_teams gta ON gta.game_id = g.id AND gta.is_away = TRUE
    WHERE g.status = 'finished'
),
user_totals AS (
    SELECT
        user_id,
        SUM(is_exact) AS exact_scores,
        SUM(is_sign) AS correct_signs,
        SUM(is_home_scorer + is_away_scorer) AS correct_scorers,
        SUM(is_exact * 4 + is_sign * 1 + (is_home_scorer + is_away_scorer) * 3) AS game_points,
        COALESCE(MAX(CASE WHEN phase = 'final'
            THEN is_exact * 4 + is_sign * 1 + (is_home_scorer + is_away_scorer) * 3
        END), 0) AS final_total,
        MIN(CASE WHEN phase = 'final' THEN prediction_created_at END) AS final_timestamp
    FROM prediction_scores
    GROUP BY user_id
),
champion_bonus AS (
    SELECT
        cp.user_id,
        COALESCE(tt.is_winner, FALSE) AS winner_bonus,
        COALESCE(pt.is_top_scorer, FALSE) AS top_scorer_bonus,
        CASE WHEN tt.is_winner = TRUE THEN 15 ELSE 0 END AS winner_pts,
        CASE WHEN pt.is_top_scorer = TRUE THEN 10 ELSE 0 END AS top_scorer_pts
    FROM champion_predictions cp
    LEFT JOIN team_tournaments tt ON tt.team_id = cp.team_id
        AND tt.tournament_id = (SELECT id FROM tournaments ORDER BY season DESC LIMIT 1)
    LEFT JOIN player_tournaments pt ON pt.player_id = cp.player_id
        AND pt.tournament_id = tt.tournament_id
)
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            COALESCE(ut.game_points, 0) + COALESCE(cb.winner_pts, 0) + COALESCE(cb.top_scorer_pts, 0) DESC,
            COALESCE(ut.exact_scores, 0) DESC,
            COALESCE(ut.correct_scorers, 0) DESC,
            COALESCE(ut.correct_signs, 0) DESC,
            COALESCE(ut.final_total, 0) DESC,
            ut.final_timestamp ASC NULLS LAST,
            u.username ASC
    ) AS position,
    u.id AS user_id,
    u.username,
    COALESCE(ut.game_points, 0) + COALESCE(cb.winner_pts, 0) + COALESCE(cb.top_scorer_pts, 0) AS total,
    COALESCE(ut.exact_scores, 0) AS exact_scores,
    COALESCE(ut.correct_signs, 0) AS correct_signs,
    COALESCE(ut.correct_scorers, 0) AS correct_scorers,
    COALESCE(cb.winner_bonus, FALSE) AS winner_bonus,
    COALESCE(cb.top_scorer_bonus, FALSE) AS top_scorer_bonus
FROM users u
LEFT JOIN user_totals ut ON ut.user_id = u.id
LEFT JOIN champion_bonus cb ON cb.user_id = u.id
WHERE u.is_active = TRUE
ORDER BY position;
```

- [ ] **Step 5: Update V1 — add is_active to users table**

Modify `src/main/resources/db/migration/V1__create_users_table.sql` to add the `is_active` column. Since there's no production data, we can edit V1 directly. The updated file:

```sql
CREATE TABLE users
(
    id         BIGSERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
```

**Important:** Since V1 has already been applied to your local database, you need to drop and recreate it before running migrations. Run:

`cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:clean flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev -Dflyway.cleanDisabled=false`

- [ ] **Step 6: Verify migrations run**

Expected: `Successfully applied 5 migrations` (V1 through V5)

- [ ] **Step 7: Commit**

```bash
git add src/main/resources/db/migration/
git commit -m "feat: add database migrations for tournaments, games, predictions, ranking view"
```

---

## Task 2: Tournament, Team, Player Entities & Repositories

**Files:**
- Create: `src/main/kotlin/com/goalcast/entity/Tournament.kt`
- Create: `src/main/kotlin/com/goalcast/entity/Team.kt`
- Create: `src/main/kotlin/com/goalcast/entity/Player.kt`
- Create: `src/main/kotlin/com/goalcast/entity/TeamTournament.kt`
- Create: `src/main/kotlin/com/goalcast/entity/PlayerTournament.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TournamentRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TeamRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/PlayerRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TeamTournamentRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/PlayerTournamentRepository.kt`
- Modify: `src/main/kotlin/com/goalcast/entity/User.kt`

- [ ] **Step 1: Update User entity with isActive**

In `src/main/kotlin/com/goalcast/entity/User.kt`, add `isActive` after the `password` field:

```kotlin
@Column(name = "is_active", nullable = false)
val isActive: Boolean = false,
```

- [ ] **Step 2: Create Tournament entity**

Create `src/main/kotlin/com/goalcast/entity/Tournament.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "tournaments")
class Tournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(nullable = false)
    var name: String,

    @Column
    var country: String? = null,

    @Column
    var logo: String? = null,

    @Column(nullable = false)
    var season: Int,

    @Column(name = "is_cup", nullable = false)
    var isCup: Boolean = false,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "final_started_at")
    var finalStartedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
```

- [ ] **Step 3: Create Team entity**

Create `src/main/kotlin/com/goalcast/entity/Team.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "teams")
class Team(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(nullable = false)
    var name: String,

    @Column
    var code: String? = null,

    @Column
    var logo: String? = null,

    @Column(name = "is_national", nullable = false)
    var isNational: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
```

- [ ] **Step 4: Create Player entity**

Create `src/main/kotlin/com/goalcast/entity/Player.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "players")
class Player(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(name = "displayed_name", nullable = false)
    var displayedName: String,

    @Column(name = "first_name")
    var firstName: String? = null,

    @Column(name = "last_name")
    var lastName: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    var club: Team? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "national_id")
    var national: Team? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
```

- [ ] **Step 5: Create TeamTournament entity**

Create `src/main/kotlin/com/goalcast/entity/TeamTournament.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "team_tournaments", uniqueConstraints = [UniqueConstraint(columnNames = ["team_id", "tournament_id"])])
class TeamTournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    val team: Team,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(name = "is_winner", nullable = false)
    var isWinner: Boolean = false,
)
```

- [ ] **Step 6: Create PlayerTournament entity**

Create `src/main/kotlin/com/goalcast/entity/PlayerTournament.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "player_tournaments", uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "tournament_id"])])
class PlayerTournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    val player: Player,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(name = "is_top_scorer", nullable = false)
    var isTopScorer: Boolean = false,
)
```

- [ ] **Step 7: Create all repositories**

Create `src/main/kotlin/com/goalcast/repository/TournamentRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Tournament
import org.springframework.data.jpa.repository.JpaRepository

interface TournamentRepository : JpaRepository<Tournament, Long> {
    fun findByApiId(apiId: Int): Tournament?
}
```

Create `src/main/kotlin/com/goalcast/repository/TeamRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Team
import org.springframework.data.jpa.repository.JpaRepository

interface TeamRepository : JpaRepository<Team, Long> {
    fun findByApiId(apiId: Int): Team?
}
```

Create `src/main/kotlin/com/goalcast/repository/PlayerRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Player
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerRepository : JpaRepository<Player, Long> {
    fun findByApiId(apiId: Int): Player?
    fun findByNationalId(nationalId: Long): List<Player>
}
```

Create `src/main/kotlin/com/goalcast/repository/TeamTournamentRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.TeamTournament
import org.springframework.data.jpa.repository.JpaRepository

interface TeamTournamentRepository : JpaRepository<TeamTournament, Long> {
    fun findByTournamentId(tournamentId: Long): List<TeamTournament>
    fun findByTeamIdAndTournamentId(teamId: Long, tournamentId: Long): TeamTournament?
}
```

Create `src/main/kotlin/com/goalcast/repository/PlayerTournamentRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.PlayerTournament
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerTournamentRepository : JpaRepository<PlayerTournament, Long> {
    fun findByTournamentId(tournamentId: Long): List<PlayerTournament>
    fun findByPlayerIdAndTournamentId(playerId: Long, tournamentId: Long): PlayerTournament?
}
```

- [ ] **Step 8: Run existing tests to verify no regression**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All existing tests pass. The H2 test profile uses `ddl-auto: create-drop` so it picks up entity changes automatically.

- [ ] **Step 9: Commit**

```bash
git add src/main/kotlin/com/goalcast/entity/ src/main/kotlin/com/goalcast/repository/
git commit -m "feat: add tournament, team, player entities and repositories"
```

---

## Task 3: Game Entities & Repositories

**Files:**
- Create: `src/main/kotlin/com/goalcast/entity/Game.kt`
- Create: `src/main/kotlin/com/goalcast/entity/GameTeam.kt`
- Create: `src/main/kotlin/com/goalcast/entity/GameGoal.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameTeamRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameGoalRepository.kt`

- [ ] **Step 1: Create Game entity**

Create `src/main/kotlin/com/goalcast/entity/Game.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "games")
class Game(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", unique = true)
    val apiId: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(nullable = false)
    var stage: String,

    @Column(nullable = false)
    var phase: String,

    @Column(nullable = false)
    var status: String = "not_started",

    @Column(name = "started_at", nullable = false)
    var startedAt: Instant,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    fun isKnockout(): Boolean = phase != "group"
    fun isFinal(): Boolean = phase == "final"
    fun isFinished(): Boolean = status == "finished"
    fun hasStarted(): Boolean = status != "not_started"
}
```

- [ ] **Step 2: Create GameTeam entity**

Create `src/main/kotlin/com/goalcast/entity/GameTeam.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "game_teams", uniqueConstraints = [UniqueConstraint(columnNames = ["game_id", "team_id"])])
class GameTeam(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    val game: Game,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    val team: Team,

    @Column(name = "is_away", nullable = false)
    val isAway: Boolean = false,

    @Column
    var score: Int? = null,
)
```

- [ ] **Step 3: Create GameGoal entity**

Create `src/main/kotlin/com/goalcast/entity/GameGoal.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "game_goals")
class GameGoal(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    val game: Game,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = false)
    val player: Player,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    val team: Team,

    @Column(name = "is_own_goal", nullable = false)
    val isOwnGoal: Boolean = false,

    @Column(name = "scored_at")
    val scoredAt: Int? = null,
)
```

- [ ] **Step 4: Create repositories**

Create `src/main/kotlin/com/goalcast/repository/GameRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Game
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface GameRepository : JpaRepository<Game, Long> {
    fun findByApiId(apiId: Int): Game?
    fun findByTournamentIdOrderByStartedAt(tournamentId: Long): List<Game>
    fun findByStatusAndTournamentId(status: String, tournamentId: Long): List<Game>
    fun findByStatusAndStartedAtBefore(status: String, startedAt: Instant): List<Game>
}
```

Create `src/main/kotlin/com/goalcast/repository/GameTeamRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.GameTeam
import org.springframework.data.jpa.repository.JpaRepository

interface GameTeamRepository : JpaRepository<GameTeam, Long> {
    fun findByGameId(gameId: Long): List<GameTeam>
    fun findByGameIdAndIsAway(gameId: Long, isAway: Boolean): GameTeam?
}
```

Create `src/main/kotlin/com/goalcast/repository/GameGoalRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.GameGoal
import org.springframework.data.jpa.repository.JpaRepository

interface GameGoalRepository : JpaRepository<GameGoal, Long> {
    fun findByGameId(gameId: Long): List<GameGoal>
    fun deleteByGameId(gameId: Long)
}
```

- [ ] **Step 5: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/main/kotlin/com/goalcast/entity/Game.kt \
       src/main/kotlin/com/goalcast/entity/GameTeam.kt \
       src/main/kotlin/com/goalcast/entity/GameGoal.kt \
       src/main/kotlin/com/goalcast/repository/GameRepository.kt \
       src/main/kotlin/com/goalcast/repository/GameTeamRepository.kt \
       src/main/kotlin/com/goalcast/repository/GameGoalRepository.kt
git commit -m "feat: add game, game_team, game_goal entities and repositories"
```

---

## Task 4: Prediction & Ranking Entities & Repositories

**Files:**
- Create: `src/main/kotlin/com/goalcast/entity/Prediction.kt`
- Create: `src/main/kotlin/com/goalcast/entity/ChampionPrediction.kt`
- Create: `src/main/kotlin/com/goalcast/entity/RankingEntry.kt`
- Create: `src/main/kotlin/com/goalcast/repository/PredictionRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/ChampionPredictionRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/RankingRepository.kt`

- [ ] **Step 1: Create Prediction entity**

Create `src/main/kotlin/com/goalcast/entity/Prediction.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "predictions", uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "game_id"])])
class Prediction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    val game: Game,

    @Column(name = "home_score", nullable = false)
    var homeScore: Int,

    @Column(name = "away_score", nullable = false)
    var awayScore: Int,

    @Column(name = "home_scorer_id")
    var homeScorerApiId: Int? = null,

    @Column(name = "away_scorer_id")
    var awayScorerApiId: Int? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    fun sign(): String = when {
        homeScore > awayScore -> "1"
        homeScore == awayScore -> "x"
        else -> "2"
    }
}
```

- [ ] **Step 2: Create ChampionPrediction entity**

Create `src/main/kotlin/com/goalcast/entity/ChampionPrediction.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "champion_predictions")
class ChampionPrediction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: User,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    var team: Team,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = false)
    var player: Player,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
```

- [ ] **Step 3: Create RankingEntry entity (read-only, mapped to ranking_view)**

Create `src/main/kotlin/com/goalcast/entity/RankingEntry.kt`:

```kotlin
package com.goalcast.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Immutable

@Entity
@Immutable
@Table(name = "ranking_view")
class RankingEntry(
    @Id
    @Column(name = "user_id")
    val userId: Long = 0,

    @Column
    val position: Long = 0,

    @Column
    val username: String = "",

    @Column
    val total: Long = 0,

    @Column(name = "exact_scores")
    val exactScores: Long = 0,

    @Column(name = "correct_signs")
    val correctSigns: Long = 0,

    @Column(name = "correct_scorers")
    val correctScorers: Long = 0,

    @Column(name = "winner_bonus")
    val winnerBonus: Boolean = false,

    @Column(name = "top_scorer_bonus")
    val topScorerBonus: Boolean = false,
)
```

- [ ] **Step 4: Create repositories**

Create `src/main/kotlin/com/goalcast/repository/PredictionRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Prediction
import org.springframework.data.jpa.repository.JpaRepository

interface PredictionRepository : JpaRepository<Prediction, Long> {
    fun findByUserId(userId: Long): List<Prediction>
    fun findByUserIdAndGameId(userId: Long, gameId: Long): Prediction?
    fun findByGameId(gameId: Long): List<Prediction>
}
```

Create `src/main/kotlin/com/goalcast/repository/ChampionPredictionRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.ChampionPrediction
import org.springframework.data.jpa.repository.JpaRepository

interface ChampionPredictionRepository : JpaRepository<ChampionPrediction, Long> {
    fun findByUserId(userId: Long): ChampionPrediction?
    fun findAll(): List<ChampionPrediction>
}
```

Create `src/main/kotlin/com/goalcast/repository/RankingRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.RankingEntry
import org.springframework.data.jpa.repository.JpaRepository

interface RankingRepository : JpaRepository<RankingEntry, Long> {
    fun findAllByOrderByPositionAsc(): List<RankingEntry>
}
```

- [ ] **Step 5: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/main/kotlin/com/goalcast/entity/Prediction.kt \
       src/main/kotlin/com/goalcast/entity/ChampionPrediction.kt \
       src/main/kotlin/com/goalcast/entity/Rank.kt \
       src/main/kotlin/com/goalcast/repository/PredictionRepository.kt \
       src/main/kotlin/com/goalcast/repository/ChampionPredictionRepository.kt \
       src/main/kotlin/com/goalcast/repository/RankRepository.kt
git commit -m "feat: add prediction, champion_prediction, rank entities and repositories"
```

---

## Task 5: ApiSport HTTP Client

**Files:**
- Create: `src/main/kotlin/com/goalcast/config/ApiSportConfig.kt`
- Create: `src/main/kotlin/com/goalcast/client/ApiSportClient.kt`
- Modify: `src/main/kotlin/com/goalcast/GoalCastApplication.kt`
- Modify: `src/main/resources/application.yml`

- [ ] **Step 1: Add config properties to application.yml**

Append to the end of `src/main/resources/application.yml`:

```yaml

apisport:
    base-url: https://v3.football.api-sports.io
    api-key: ${APISPORT_API_KEY:}
    league-id: ${APISPORT_LEAGUE_ID:1}
    season: ${APISPORT_SEASON:2026}
```

- [ ] **Step 2: Create config class**

Create `src/main/kotlin/com/goalcast/config/ApiSportConfig.kt`:

```kotlin
package com.goalcast.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

@ConfigurationProperties(prefix = "apisport")
data class ApiSportProperties(
    val baseUrl: String = "https://v3.football.api-sports.io",
    val apiKey: String = "",
    val leagueId: Int = 1,
    val season: Int = 2026,
)

@Configuration
class ApiSportConfig {

    @Bean
    fun apiSportRestClient(properties: ApiSportProperties): RestClient {
        return RestClient.builder()
            .baseUrl(properties.baseUrl)
            .defaultHeader("x-apisports-key", properties.apiKey)
            .build()
    }
}
```

- [ ] **Step 3: Add @ConfigurationPropertiesScan to application class**

Replace `src/main/kotlin/com/goalcast/GoalCastApplication.kt`:

```kotlin
package com.goalcast

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@EnableRedisRepositories(basePackages = [])
@EnableRedisHttpSession
@SpringBootApplication
@ConfigurationPropertiesScan
class GoalCastApplication

fun main(args: Array<String>) {
    runApplication<GoalCastApplication>(*args)
}
```

- [ ] **Step 4: Create the ApiSport client**

Create `src/main/kotlin/com/goalcast/client/ApiSportClient.kt`:

```kotlin
package com.goalcast.client

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class ApiSportClient(
    private val apiSportRestClient: RestClient,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(ApiSportClient::class.java)

    fun get(endpoint: String, params: Map<String, String> = emptyMap()): List<JsonNode> {
        val uri = buildString {
            append("/")
            append(endpoint)
            if (params.isNotEmpty()) {
                append("?")
                append(params.entries.joinToString("&") { "${it.key}=${it.value}" })
            }
        }
        log.info("ApiSport GET {}", uri)

        val body = apiSportRestClient.get()
            .uri(uri)
            .retrieve()
            .body(String::class.java)

        val root = objectMapper.readTree(body)
        val errors = root.path("errors")
        if (errors.isObject && errors.has("token")) {
            throw IllegalStateException("Invalid ApiSport token")
        }

        val response = root.path("response")
        if (!response.isArray) {
            throw IllegalStateException("Unexpected ApiSport response: missing 'response' array")
        }

        log.info("ApiSport returned {} results", response.size())
        return response.toList()
    }
}
```

- [ ] **Step 5: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/main/kotlin/com/goalcast/config/ApiSportConfig.kt \
       src/main/kotlin/com/goalcast/client/ApiSportClient.kt \
       src/main/kotlin/com/goalcast/GoalCastApplication.kt \
       src/main/resources/application.yml
git commit -m "feat: add ApiSport HTTP client with configuration"
```

---

## Task 6: ApiSport Sync Service

**Files:**
- Create: `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`
- Create: `src/test/kotlin/com/goalcast/service/ApiSportSyncServiceTest.kt`

- [ ] **Step 1: Write the sync service**

Create `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`:

```kotlin
package com.goalcast.service

import com.fasterxml.jackson.databind.JsonNode
import com.goalcast.client.ApiSportClient
import com.goalcast.config.ApiSportProperties
import com.goalcast.entity.*
import com.goalcast.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class ApiSportSyncService(
    private val client: ApiSportClient,
    private val props: ApiSportProperties,
    private val tournamentRepository: TournamentRepository,
    private val teamRepository: TeamRepository,
    private val playerRepository: PlayerRepository,
    private val teamTournamentRepository: TeamTournamentRepository,
    private val playerTournamentRepository: PlayerTournamentRepository,
    private val gameRepository: GameRepository,
    private val gameTeamRepository: GameTeamRepository,
    private val gameGoalRepository: GameGoalRepository,
) {
    private val log = LoggerFactory.getLogger(ApiSportSyncService::class.java)

    @Transactional
    fun syncTeams() {
        val results = client.get("teams", mapOf("league" to props.leagueId.toString(), "season" to props.season.toString()))
        val tournament = getOrCreateTournament()

        for (node in results) {
            val t = node.path("team")
            val apiId = t.path("id").asInt()
            val team = teamRepository.findByApiId(apiId) ?: Team(apiId = apiId, name = t.path("name").asText())
            team.name = t.path("name").asText()
            team.code = t.path("code").asText(null)
            team.logo = t.path("logo").asText(null)
            team.isNational = t.path("national").asBoolean(false)
            team.updatedAt = Instant.now()
            teamRepository.save(team)

            if (teamTournamentRepository.findByTeamIdAndTournamentId(team.id, tournament.id) == null) {
                teamTournamentRepository.save(TeamTournament(team = team, tournament = tournament))
            }
        }
        log.info("Synced {} teams", results.size)
    }

    @Transactional
    fun syncPlayers() {
        val tournament = getOrCreateTournament()
        val teamTournaments = teamTournamentRepository.findByTournamentId(tournament.id)

        for (tt in teamTournaments) {
            val results = client.get("players/squads", mapOf("team" to tt.team.apiId.toString()))
            if (results.isEmpty()) continue

            val playersNode = results[0].path("players")
            for (p in playersNode) {
                val apiId = p.path("id").asInt()
                val player = playerRepository.findByApiId(apiId)
                    ?: Player(apiId = apiId, displayedName = p.path("name").asText())
                player.displayedName = p.path("name").asText()
                player.national = tt.team
                player.updatedAt = Instant.now()
                playerRepository.save(player)

                if (playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) == null) {
                    playerTournamentRepository.save(PlayerTournament(player = player, tournament = tournament))
                }
            }
            log.info("Synced players for team {}", tt.team.name)

            // Rate limit: ApiSport allows ~10 requests/minute
            Thread.sleep(6000)
        }
    }

    @Transactional
    fun syncGames() {
        val tournament = getOrCreateTournament()
        val results = client.get("fixtures", mapOf("league" to props.leagueId.toString(), "season" to props.season.toString()))

        for (node in results) {
            val fixture = node.path("fixture")
            val apiId = fixture.path("id").asInt()
            val startedAt = Instant.ofEpochSecond(fixture.path("timestamp").asLong())
            val round = node.path("league").path("round").asText()
            val phase = mapRoundToPhase(round)
            val statusShort = fixture.path("status").path("short").asText()

            val game = gameRepository.findByApiId(apiId)
                ?: Game(apiId = apiId, tournament = tournament, stage = round, phase = phase, startedAt = startedAt)
            game.stage = round
            game.phase = phase
            game.status = mapApiStatus(statusShort)
            game.startedAt = startedAt
            game.updatedAt = Instant.now()
            gameRepository.save(game)

            val homeTeamApiId = node.path("teams").path("home").path("id").asInt()
            val awayTeamApiId = node.path("teams").path("away").path("id").asInt()
            val homeScore = node.path("goals").path("home").let { if (it.isNull) null else it.asInt() }
            val awayScore = node.path("goals").path("away").let { if (it.isNull) null else it.asInt() }

            upsertGameTeam(game, homeTeamApiId, isAway = false, score = homeScore)
            upsertGameTeam(game, awayTeamApiId, isAway = true, score = awayScore)
        }
        log.info("Synced {} games", results.size)

        // Update tournament dates from games
        updateTournamentDates(tournament)
    }

    @Transactional
    fun syncGoals(gameApiId: Int) {
        val game = gameRepository.findByApiId(gameApiId) ?: return
        val results = client.get("fixtures/events", mapOf("fixture" to gameApiId.toString(), "type" to "Goal"))

        gameGoalRepository.deleteByGameId(game.id)

        val gameTeams = gameTeamRepository.findByGameId(game.id)
        val homeTeam = gameTeams.find { !it.isAway }?.team
        val awayTeam = gameTeams.find { it.isAway }?.team

        for (node in results) {
            val detail = node.path("detail").asText()
            if (detail.contains("Missed")) continue

            val time = node.path("time")
            val elapsed = time.path("elapsed").asInt()
            val extra = if (time.path("extra").isNull) 0 else time.path("extra").asInt()
            val comment = node.path("comments").asText("")

            // Skip penalty shootout goals
            if (elapsed == 120 && extra > 0 && comment.contains("Penalty", ignoreCase = true)) continue

            val playerApiId = node.path("player").path("id").asInt()
            val player = playerRepository.findByApiId(playerApiId) ?: continue

            val isOwnGoal = detail.contains("Own", ignoreCase = true)

            // Determine which team was credited the goal
            val teamNode = node.path("team")
            val scoringTeamApiId = teamNode.path("id").asInt()
            val creditedTeam = if (isOwnGoal) {
                // Own goal: credited to the other team
                if (scoringTeamApiId == homeTeam?.apiId) awayTeam else homeTeam
            } else {
                if (scoringTeamApiId == homeTeam?.apiId) homeTeam else awayTeam
            }

            if (creditedTeam != null) {
                gameGoalRepository.save(
                    GameGoal(
                        game = game,
                        player = player,
                        team = creditedTeam,
                        isOwnGoal = isOwnGoal,
                        scoredAt = elapsed + extra,
                    )
                )
            }
        }
        log.info("Synced goals for game {}", gameApiId)
    }

    @Transactional
    fun syncTopScorers() {
        val tournament = getOrCreateTournament()
        val results = client.get("players/topscorers", mapOf("league" to props.leagueId.toString(), "season" to props.season.toString()))

        if (results.isEmpty()) return
        val topScorerGoals = results[0].path("statistics")[0].path("goals").path("total").asInt()

        for (node in results) {
            val goals = node.path("statistics")[0].path("goals").path("total").asInt()
            if (goals < topScorerGoals) break // Only mark players tied at the top

            val playerApiId = node.path("player").path("id").asInt()
            val player = playerRepository.findByApiId(playerApiId) ?: continue
            val pt = playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) ?: continue
            pt.isTopScorer = true
            playerTournamentRepository.save(pt)
        }
        log.info("Synced top scorers")
    }

    @Transactional
    fun syncWinner() {
        val tournament = getOrCreateTournament()
        val finalGames = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
            .filter { it.phase == "final" && it.isFinished() }

        if (finalGames.isEmpty()) return

        val finalGame = finalGames.last()
        val gameTeams = gameTeamRepository.findByGameId(finalGame.id)
        val winner = gameTeams.maxByOrNull { it.score ?: 0 }?.team ?: return

        val tt = teamTournamentRepository.findByTeamIdAndTournamentId(winner.id, tournament.id) ?: return
        tt.isWinner = true
        teamTournamentRepository.save(tt)
        log.info("Tournament winner: {}", winner.name)
    }

    private fun getOrCreateTournament(): Tournament {
        return tournamentRepository.findByApiId(props.leagueId)
            ?: tournamentRepository.save(
                Tournament(
                    apiId = props.leagueId,
                    name = "World Cup ${props.season}",
                    season = props.season,
                    isCup = true,
                )
            )
    }

    private fun upsertGameTeam(game: Game, teamApiId: Int, isAway: Boolean, score: Int?) {
        val team = teamRepository.findByApiId(teamApiId) ?: return
        val existing = gameTeamRepository.findByGameId(game.id).find { it.team.id == team.id }
        if (existing != null) {
            existing.score = score
            gameTeamRepository.save(existing)
        } else {
            gameTeamRepository.save(GameTeam(game = game, team = team, isAway = isAway, score = score))
        }
    }

    private fun updateTournamentDates(tournament: Tournament) {
        val games = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
        if (games.isEmpty()) return

        tournament.startedAt = games.first().startedAt

        val firstKnockout = games.firstOrNull { it.isKnockout() }
        if (firstKnockout != null) {
            tournament.finalStartedAt = firstKnockout.startedAt
        }
        tournament.updatedAt = Instant.now()
        tournamentRepository.save(tournament)
    }

    private fun mapRoundToPhase(round: String): String {
        val lower = round.lowercase()
        return when {
            lower.contains("group") -> "group"
            lower.contains("32") -> "round_of_32"
            lower.contains("16") -> "round_of_16"
            lower.contains("quarter") -> "quarter"
            lower.contains("semi") -> "semi"
            lower.contains("final") && !lower.contains("semi") -> "final"
            else -> "group"
        }
    }

    private fun mapApiStatus(short: String): String = when (short) {
        "FT", "AET", "PEN" -> "finished"
        "1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE" -> "ongoing"
        else -> "not_started"
    }
}
```

- [ ] **Step 2: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass (this service isn't called by tests yet, but the app context should still load).

- [ ] **Step 3: Commit**

```bash
git add src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt
git commit -m "feat: add ApiSport sync service for teams, players, games, goals, and winners"
```

---

## Task 7: User Activation Gate + Updated Auth Response

**Files:**
- Modify: `src/main/kotlin/com/goalcast/dto/UserDto.kt`
- Modify: `src/main/kotlin/com/goalcast/controller/AuthController.kt`
- Modify: `src/main/kotlin/com/goalcast/service/UserService.kt`
- Modify: `src/test/kotlin/com/goalcast/controller/AuthControllerTest.kt`

- [ ] **Step 1: Update UserDto to include isActive**

Replace `src/main/kotlin/com/goalcast/dto/UserDto.kt`:

```kotlin
package com.goalcast.dto

data class UserDto(
    val username: String,
    val email: String,
    val roles: List<String>,
    val isActive: Boolean,
)
```

- [ ] **Step 2: Update AuthController to return isActive**

In `src/main/kotlin/com/goalcast/controller/AuthController.kt`, update the `login` method to look up the user entity:

```kotlin
package com.goalcast.controller

import com.goalcast.dto.UserDto
import com.goalcast.dto.request.LoginRequest
import com.goalcast.dto.request.RegisterRequest
import com.goalcast.repository.UserRepository
import com.goalcast.service.UserService
import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
    private val userRepository: UserRepository,
) {
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    fun login(@Valid @RequestBody request: LoginRequest, session: HttpSession): UserDto {
        val authToken = UsernamePasswordAuthenticationToken(request.email, request.password)
        val authentication = authenticationManager.authenticate(authToken)

        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication
        SecurityContextHolder.setContext(context)
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        )

        val user = authentication.principal as UserDetails
        val entity = requireNotNull(userRepository.findByEmail(user.username))
        return UserDto(entity.username, entity.email, user.authorities.mapNotNull { it.authority }, entity.isActive)
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest) = userService.register(request)

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal user: UserDetails?): ResponseEntity<UserDto> {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        val entity = requireNotNull(userRepository.findByEmail(user.username))
        return ResponseEntity.ok(
            UserDto(entity.username, entity.email, user.authorities.mapNotNull { it.authority }, entity.isActive)
        )
    }
}
```

- [ ] **Step 3: Update UserService.register to return isActive=false**

In `src/main/kotlin/com/goalcast/service/UserService.kt`, update the return line:

```kotlin
return UserDto(user.username, user.email, listOf("ROLE_USER"), false)
```

- [ ] **Step 4: Update existing AuthControllerTest**

In the login test, add the `isActive` check. Update `src/test/kotlin/com/goalcast/controller/AuthControllerTest.kt`:

In the `setup()` method, the user is created with default `isActive = false`. Update the login test expectation:

```kotlin
@Test
fun `login with valid credentials returns 200 and user data`() {
    mockMvc.post("/api/auth/login") {
        contentType = MediaType.APPLICATION_JSON
        content = """{"email": "ciccio@email.com", "password": "Adamo123"}"""
    }.andExpect {
        status { isOk() }
        jsonPath("$.username") { value("cicciofrizzo") }
        jsonPath("$.roles[0]") { value("ROLE_USER") }
        jsonPath("$.isActive") { value(false) }
    }
}
```

Also fix the login request body in the existing test — the field name should be `email`, not `username` (to match `LoginRequest`). Check and fix both login tests.

- [ ] **Step 5: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/main/kotlin/com/goalcast/dto/UserDto.kt \
       src/main/kotlin/com/goalcast/controller/AuthController.kt \
       src/main/kotlin/com/goalcast/service/UserService.kt \
       src/test/kotlin/com/goalcast/controller/AuthControllerTest.kt
git commit -m "feat: add isActive flag to user auth response"
```

---

*Tasks 8 and 9 from the original plan (ScoringService and RankingService) have been replaced by the `ranking_view` PostgreSQL view created in Task 1, Step 4. All scoring logic lives in SQL. No application-side scoring engine or ranking service needed.*

---

## Task 10: DTOs & Response Objects

**Files:**
- Create: `src/main/kotlin/com/goalcast/dto/request/PredictionRequest.kt`
- Create: `src/main/kotlin/com/goalcast/dto/request/ChampionRequest.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/GameResponse.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/GameDetailResponse.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/PredictionResponse.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/ChampionResponse.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/RankingResponse.kt`
- Create: `src/main/kotlin/com/goalcast/dto/response/TournamentResponse.kt`

- [ ] **Step 1: Create request DTOs**

Create `src/main/kotlin/com/goalcast/dto/request/PredictionRequest.kt`:

```kotlin
package com.goalcast.dto.request

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

data class PredictionRequest(
    @field:NotNull val gameId: Long,
    @field:NotNull @field:Min(0) val homeScore: Int,
    @field:NotNull @field:Min(0) val awayScore: Int,
    val homeScorerApiId: Int? = null,
    val awayScorerApiId: Int? = null,
)
```

Create `src/main/kotlin/com/goalcast/dto/request/ChampionRequest.kt`:

```kotlin
package com.goalcast.dto.request

import jakarta.validation.constraints.NotNull

data class ChampionRequest(
    @field:NotNull val teamId: Long,
    @field:NotNull val playerId: Long,
)
```

- [ ] **Step 2: Create response DTOs**

Create `src/main/kotlin/com/goalcast/dto/response/GameResponse.kt`:

```kotlin
package com.goalcast.dto.response

import java.time.Instant

data class TeamInfo(
    val id: Long,
    val name: String,
    val code: String?,
    val logo: String?,
    val score: Int?,
)

data class GameResponse(
    val id: Long,
    val stage: String,
    val phase: String,
    val status: String,
    val startedAt: Instant,
    val homeTeam: TeamInfo,
    val awayTeam: TeamInfo,
    val predicted: Boolean,
)
```

Create `src/main/kotlin/com/goalcast/dto/response/GameDetailResponse.kt`:

```kotlin
package com.goalcast.dto.response

import java.time.Instant

data class GoalInfo(
    val playerName: String,
    val teamName: String,
    val isOwnGoal: Boolean,
    val minute: Int?,
)

data class GameDetailResponse(
    val id: Long,
    val stage: String,
    val phase: String,
    val status: String,
    val startedAt: Instant,
    val homeTeam: TeamInfo,
    val awayTeam: TeamInfo,
    val goals: List<GoalInfo>,
)
```

Create `src/main/kotlin/com/goalcast/dto/response/PredictionResponse.kt`:

```kotlin
package com.goalcast.dto.response

data class PredictionResponse(
    val gameId: Long,
    val homeScore: Int,
    val awayScore: Int,
    val homeScorerApiId: Int?,
    val awayScorerApiId: Int?,
)

data class MemberPredictionResponse(
    val username: String,
    val homeScore: Int,
    val awayScore: Int,
    val homeScorerApiId: Int?,
    val awayScorerApiId: Int?,
)
```

Create `src/main/kotlin/com/goalcast/dto/response/ChampionResponse.kt`:

```kotlin
package com.goalcast.dto.response

data class ChampionResponse(
    val teamId: Long,
    val teamName: String,
    val playerId: Long,
    val playerName: String,
)

data class MemberChampionResponse(
    val username: String,
    val teamName: String,
    val playerName: String,
)
```

Create `src/main/kotlin/com/goalcast/dto/response/RankingResponse.kt`:

```kotlin
package com.goalcast.dto.response

data class RankEntry(
    val position: Int,
    val username: String,
    val total: Int,
    val exactScores: Int,
    val correctScorers: Int,
    val correctSigns: Int,
    val winnerBonus: Boolean,
    val topScorerBonus: Boolean,
)
```

Create `src/main/kotlin/com/goalcast/dto/response/TournamentResponse.kt`:

```kotlin
package com.goalcast.dto.response

import java.time.Instant

data class TournamentTeam(
    val id: Long,
    val name: String,
    val code: String?,
    val logo: String?,
)

data class TournamentPlayer(
    val id: Long,
    val apiId: Int,
    val displayedName: String,
    val teamName: String?,
)

data class TournamentResponse(
    val id: Long,
    val name: String,
    val season: Int,
    val startedAt: Instant?,
    val teams: List<TournamentTeam>,
    val players: List<TournamentPlayer>,
)
```

- [ ] **Step 3: Commit**

```bash
git add src/main/kotlin/com/goalcast/dto/request/PredictionRequest.kt \
       src/main/kotlin/com/goalcast/dto/request/ChampionRequest.kt \
       src/main/kotlin/com/goalcast/dto/response/
git commit -m "feat: add request and response DTOs for games, predictions, ranking, tournament"
```

---

## Task 11: Game Controller

**Files:**
- Create: `src/main/kotlin/com/goalcast/controller/GameController.kt`
- Create: `src/main/kotlin/com/goalcast/controller/TournamentController.kt`

- [ ] **Step 1: Create GameController**

Create `src/main/kotlin/com/goalcast/controller/GameController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.config.ApiSportProperties
import com.goalcast.dto.response.*
import com.goalcast.repository.*
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/games")
class GameController(
    private val gameRepository: GameRepository,
    private val gameTeamRepository: GameTeamRepository,
    private val gameGoalRepository: GameGoalRepository,
    private val predictionRepository: PredictionRepository,
    private val tournamentRepository: TournamentRepository,
    private val userRepository: UserRepository,
    private val props: ApiSportProperties,
) {
    @GetMapping
    fun listGames(@AuthenticationPrincipal principal: UserDetails): List<GameResponse> {
        val tournament = tournamentRepository.findByApiId(props.leagueId) ?: return emptyList()
        val user = requireNotNull(userRepository.findByEmail(principal.username))
        val games = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
        val userPredictions = predictionRepository.findByUserId(user.id).map { it.game.id }.toSet()

        return games.map { game ->
            val teams = gameTeamRepository.findByGameId(game.id)
            val home = teams.find { !it.isAway }
            val away = teams.find { it.isAway }
            GameResponse(
                id = game.id,
                stage = game.stage,
                phase = game.phase,
                status = game.status,
                startedAt = game.startedAt,
                homeTeam = TeamInfo(home?.team?.id ?: 0, home?.team?.name ?: "", home?.team?.code, home?.team?.logo, home?.score),
                awayTeam = TeamInfo(away?.team?.id ?: 0, away?.team?.name ?: "", away?.team?.code, away?.team?.logo, away?.score),
                predicted = game.id in userPredictions,
            )
        }
    }

    @GetMapping("/{id}")
    fun gameDetail(@PathVariable id: Long): GameDetailResponse {
        val game = gameRepository.findById(id).orElseThrow { NoSuchElementException("Game not found") }
        val teams = gameTeamRepository.findByGameId(game.id)
        val home = teams.find { !it.isAway }
        val away = teams.find { it.isAway }
        val goals = gameGoalRepository.findByGameId(game.id).map { g ->
            GoalInfo(g.player.displayedName, g.team.name, g.isOwnGoal, g.scoredAt)
        }

        return GameDetailResponse(
            id = game.id,
            stage = game.stage,
            phase = game.phase,
            status = game.status,
            startedAt = game.startedAt,
            homeTeam = TeamInfo(home?.team?.id ?: 0, home?.team?.name ?: "", home?.team?.code, home?.team?.logo, home?.score),
            awayTeam = TeamInfo(away?.team?.id ?: 0, away?.team?.name ?: "", away?.team?.code, away?.team?.logo, away?.score),
            goals = goals,
        )
    }
}
```

- [ ] **Step 2: Create TournamentController**

Create `src/main/kotlin/com/goalcast/controller/TournamentController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.config.ApiSportProperties
import com.goalcast.dto.response.TournamentPlayer
import com.goalcast.dto.response.TournamentResponse
import com.goalcast.dto.response.TournamentTeam
import com.goalcast.repository.PlayerTournamentRepository
import com.goalcast.repository.TeamTournamentRepository
import com.goalcast.repository.TournamentRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/tournaments")
class TournamentController(
    private val tournamentRepository: TournamentRepository,
    private val teamTournamentRepository: TeamTournamentRepository,
    private val playerTournamentRepository: PlayerTournamentRepository,
    private val props: ApiSportProperties,
) {
    @GetMapping("/current")
    fun currentTournament(): TournamentResponse {
        val tournament = requireNotNull(tournamentRepository.findByApiId(props.leagueId)) { "No tournament configured" }
        val teams = teamTournamentRepository.findByTournamentId(tournament.id).map {
            TournamentTeam(it.team.id, it.team.name, it.team.code, it.team.logo)
        }
        val players = playerTournamentRepository.findByTournamentId(tournament.id).map {
            TournamentPlayer(it.player.id, it.player.apiId, it.player.displayedName, it.player.national?.name)
        }

        return TournamentResponse(
            id = tournament.id,
            name = tournament.name,
            season = tournament.season,
            startedAt = tournament.startedAt,
            teams = teams,
            players = players,
        )
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/controller/GameController.kt \
       src/main/kotlin/com/goalcast/controller/TournamentController.kt
git commit -m "feat: add game list, game detail, and tournament API endpoints"
```

---

## Task 12: Prediction Controller & Service

**Files:**
- Create: `src/main/kotlin/com/goalcast/service/PredictionService.kt`
- Create: `src/main/kotlin/com/goalcast/controller/PredictionController.kt`

- [ ] **Step 1: Create PredictionService**

Create `src/main/kotlin/com/goalcast/service/PredictionService.kt`:

```kotlin
package com.goalcast.service

import com.goalcast.dto.request.PredictionRequest
import com.goalcast.entity.Prediction
import com.goalcast.entity.User
import com.goalcast.repository.GameRepository
import com.goalcast.repository.PredictionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class PredictionService(
    private val predictionRepository: PredictionRepository,
    private val gameRepository: GameRepository,
) {

    @Transactional
    fun createOrUpdate(user: User, request: PredictionRequest): Prediction {
        val game = gameRepository.findById(request.gameId)
            .orElseThrow { NoSuchElementException("Game not found") }

        require(!game.hasStarted()) { "Game has already started, predictions are locked" }

        val now = Instant.now()
        val opensAt = game.startedAt.minusSeconds(24 * 3600)
        require(now.isAfter(opensAt)) { "Predictions not open yet for this game" }

        // Scorer predictions only valid for knockout games
        val homeScorerApiId = if (game.isKnockout()) request.homeScorerApiId else null
        val awayScorerApiId = if (game.isKnockout()) request.awayScorerApiId else null

        val existing = predictionRepository.findByUserIdAndGameId(user.id, game.id)
        if (existing != null) {
            existing.homeScore = request.homeScore
            existing.awayScore = request.awayScore
            existing.homeScorerApiId = homeScorerApiId
            existing.awayScorerApiId = awayScorerApiId
            existing.updatedAt = Instant.now()
            return predictionRepository.save(existing)
        }

        return predictionRepository.save(
            Prediction(
                user = user,
                game = game,
                homeScore = request.homeScore,
                awayScore = request.awayScore,
                homeScorerApiId = homeScorerApiId,
                awayScorerApiId = awayScorerApiId,
            )
        )
    }
}
```

- [ ] **Step 2: Create PredictionController**

Create `src/main/kotlin/com/goalcast/controller/PredictionController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.dto.request.PredictionRequest
import com.goalcast.dto.response.MemberPredictionResponse
import com.goalcast.dto.response.PredictionResponse
import com.goalcast.repository.GameRepository
import com.goalcast.repository.PredictionRepository
import com.goalcast.repository.UserRepository
import com.goalcast.service.PredictionService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/predictions")
class PredictionController(
    private val predictionService: PredictionService,
    private val predictionRepository: PredictionRepository,
    private val gameRepository: GameRepository,
    private val userRepository: UserRepository,
) {
    @GetMapping
    fun myPredictions(@AuthenticationPrincipal principal: UserDetails): List<PredictionResponse> {
        val user = requireNotNull(userRepository.findByEmail(principal.username))
        return predictionRepository.findByUserId(user.id).map {
            PredictionResponse(it.game.id, it.homeScore, it.awayScore, it.homeScorerApiId, it.awayScorerApiId)
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    fun savePrediction(
        @AuthenticationPrincipal principal: UserDetails,
        @Valid @RequestBody request: PredictionRequest,
    ): PredictionResponse {
        val user = requireNotNull(userRepository.findByEmail(principal.username))
        if (!user.isActive) throw ResponseStatusException(HttpStatus.FORBIDDEN, "Account not activated")

        val prediction = predictionService.createOrUpdate(user, request)
        return PredictionResponse(prediction.game.id, prediction.homeScore, prediction.awayScore, prediction.homeScorerApiId, prediction.awayScorerApiId)
    }

    @GetMapping("/game/{gameId}")
    fun gamePredictions(@PathVariable gameId: Long): List<MemberPredictionResponse> {
        val game = gameRepository.findById(gameId)
            .orElseThrow { NoSuchElementException("Game not found") }

        if (!game.hasStarted()) throw ResponseStatusException(HttpStatus.FORBIDDEN, "Predictions hidden until kickoff")

        return predictionRepository.findByGameId(gameId).map {
            MemberPredictionResponse(it.user.username, it.homeScore, it.awayScore, it.homeScorerApiId, it.awayScorerApiId)
        }
    }
}
```

- [ ] **Step 3: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/service/PredictionService.kt \
       src/main/kotlin/com/goalcast/controller/PredictionController.kt
git commit -m "feat: add prediction CRUD with activation gate and visibility rules"
```

---

## Task 13: Champion Prediction Controller

**Files:**
- Create: `src/main/kotlin/com/goalcast/controller/ChampionController.kt`

- [ ] **Step 1: Create ChampionController**

Create `src/main/kotlin/com/goalcast/controller/ChampionController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.config.ApiSportProperties
import com.goalcast.dto.request.ChampionRequest
import com.goalcast.dto.response.ChampionResponse
import com.goalcast.dto.response.MemberChampionResponse
import com.goalcast.entity.ChampionPrediction
import com.goalcast.repository.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@RestController
@RequestMapping("/api/champion")
class ChampionController(
    private val championPredictionRepository: ChampionPredictionRepository,
    private val userRepository: UserRepository,
    private val teamRepository: TeamRepository,
    private val playerRepository: PlayerRepository,
    private val tournamentRepository: TournamentRepository,
    private val props: ApiSportProperties,
) {
    @GetMapping
    fun myChampion(@AuthenticationPrincipal principal: UserDetails): ResponseEntity<ChampionResponse> {
        val user = requireNotNull(userRepository.findByEmail(principal.username))
        val cp = championPredictionRepository.findByUserId(user.id) ?: return ResponseEntity.noContent().build()
        return ResponseEntity.ok(ChampionResponse(cp.team.id, cp.team.name, cp.player.id, cp.player.displayedName))
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    fun saveChampion(
        @AuthenticationPrincipal principal: UserDetails,
        @Valid @RequestBody request: ChampionRequest,
    ): ChampionResponse {
        val user = requireNotNull(userRepository.findByEmail(principal.username))
        if (!user.isActive) throw ResponseStatusException(HttpStatus.FORBIDDEN, "Account not activated")

        val tournament = requireNotNull(tournamentRepository.findByApiId(props.leagueId))
        val startedAt = tournament.startedAt
        if (startedAt != null && Instant.now().isAfter(startedAt)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Champion predictions locked after tournament start")
        }

        val team = teamRepository.findById(request.teamId)
            .orElseThrow { NoSuchElementException("Team not found") }
        val player = playerRepository.findById(request.playerId)
            .orElseThrow { NoSuchElementException("Player not found") }

        val existing = championPredictionRepository.findByUserId(user.id)
        if (existing != null) {
            existing.team = team
            existing.player = player
            existing.updatedAt = Instant.now()
            championPredictionRepository.save(existing)
            return ChampionResponse(team.id, team.name, player.id, player.displayedName)
        }

        championPredictionRepository.save(
            ChampionPrediction(user = user, team = team, player = player)
        )
        return ChampionResponse(team.id, team.name, player.id, player.displayedName)
    }

    @GetMapping("/all")
    fun allChampions(): List<MemberChampionResponse> {
        val tournament = requireNotNull(tournamentRepository.findByApiId(props.leagueId))
        val startedAt = tournament.startedAt
        if (startedAt == null || Instant.now().isBefore(startedAt)) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Champion predictions hidden until tournament start")
        }

        return championPredictionRepository.findAll().map {
            MemberChampionResponse(it.user.username, it.team.name, it.player.displayedName)
        }
    }
}
```

- [ ] **Step 2: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/main/kotlin/com/goalcast/controller/ChampionController.kt
git commit -m "feat: add champion prediction CRUD with lockout after tournament start"
```

---

## Task 14: Ranking Controller

**Files:**
- Create: `src/main/kotlin/com/goalcast/controller/RankingController.kt`

- [ ] **Step 1: Create RankingController**

Create `src/main/kotlin/com/goalcast/controller/RankingController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.dto.response.RankEntry
import com.goalcast.repository.RankingRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/ranking")
class RankingController(
    private val rankingRepository: RankingRepository,
) {
    @GetMapping
    fun ranking(): List<RankEntry> {
        return rankingRepository.findAllByOrderByPositionAsc().map { entry ->
            RankEntry(
                position = entry.position.toInt(),
                username = entry.username,
                total = entry.total.toInt(),
                exactScores = entry.exactScores.toInt(),
                correctScorers = entry.correctScorers.toInt(),
                correctSigns = entry.correctSigns.toInt(),
                winnerBonus = entry.winnerBonus,
                topScorerBonus = entry.topScorerBonus,
            )
        }
    }
}
```

- [ ] **Step 2: Run all tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 3: Verify the full app starts**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw spring-boot:run`

Expected: App starts cleanly on port 8080. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/controller/RankingController.kt
git commit -m "feat: add ranking API endpoint"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Tournament/Team/Player/Game data model
- ✅ ApiSport sync (teams, players, games, goals, top scorers, winner)
- ✅ User activation gate (is_active flag, blocks POST predictions)
- ✅ Auth returns isActive
- ✅ Prediction CRUD with 24h window validation
- ✅ Scorer predictions knockout-only
- ✅ Champion predictions with tournament-start lockout
- ✅ Prediction visibility after kickoff
- ✅ NewGame scoring via PostgreSQL view (4/1/3 stacking, scorer matching, champion bonus 15/10)
- ✅ Ranking with all 7 tiebreakers via ROW_NUMBER()
- ✅ Game list and detail endpoints
- ✅ Tournament current endpoint (for champion picker dropdowns)

**Not included (by design):**
- No league entity (single implicit league)
- No OldGame scoring
- No owner controller
- No scheduled jobs (sync is callable but not scheduled yet)
- No frontend
- No application-side scoring engine (scoring logic lives in the ranking_view SQL)

# ApiSport Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ApiSport data pipeline: database tables, JPA entities, HTTP client, sync service, fake seed data, and scheduled jobs for tournaments, teams, players, games, and goals.

**Architecture:** Flyway creates the tables. A `RestClient`-based HTTP client talks to ApiSport. A sync service orchestrates upserts. Spring `@Scheduled` runs syncs automatically. Seed SQL scripts populate fake data for local testing.

**Tech Stack:** Spring Boot 4.0.3, Kotlin 2.2.21, PostgreSQL 17, Flyway, RestClient, JUnit 5, MockK

**Scope:** Tournament data only. No predictions, no rankings, no user changes.

---

## Task 1: Database Migrations

**Files:**
- Create: `src/main/resources/db/migration/V2__create_tournament_tables.sql`
- Create: `src/main/resources/db/migration/V3__create_game_tables.sql`

- [ ] **Step 1: Write V2 — tournaments, teams, players, join tables**

Create `src/main/resources/db/migration/V2__create_tournament_tables.sql`:

```sql
CREATE TABLE tournaments (
    id               BIGSERIAL PRIMARY KEY,
    api_id           INTEGER NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    country          VARCHAR(100),
    logo             VARCHAR(500),
    season           INTEGER NOT NULL,
    is_cup           BOOLEAN NOT NULL DEFAULT FALSE,
    started_at       TIMESTAMP,
    final_started_at TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now()
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
    CONSTRAINT chk_club_national_differ CHECK (
        club_id IS NULL OR national_id IS NULL OR club_id <> national_id
    )
);

CREATE TABLE team_tournaments (
    id            BIGSERIAL PRIMARY KEY,
    team_id       BIGINT NOT NULL REFERENCES teams(id),
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    is_winner     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_team_tournament UNIQUE (team_id, tournament_id)
);

CREATE TABLE player_tournaments (
    id            BIGSERIAL PRIMARY KEY,
    player_id     BIGINT NOT NULL REFERENCES players(id),
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    is_top_scorer BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_player_tournament UNIQUE (player_id, tournament_id)
);

CREATE INDEX idx_tournaments_api_id ON tournaments (api_id);
CREATE INDEX idx_teams_api_id ON teams (api_id);
CREATE INDEX idx_players_api_id ON players (api_id);
CREATE INDEX idx_players_national_id ON players (national_id);
```

- [ ] **Step 2: Write V3 — games, game_teams, game_goals**

Create `src/main/resources/db/migration/V3__create_game_tables.sql`:

```sql
CREATE TABLE games (
    id            BIGSERIAL PRIMARY KEY,
    api_id        INTEGER UNIQUE,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    stage         VARCHAR(100) NOT NULL,
    phase         VARCHAR(20) NOT NULL CHECK (
        phase IN ('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'final')
    ),
    status        VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'ongoing', 'finished')
    ),
    started_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE game_teams (
    id      BIGSERIAL PRIMARY KEY,
    game_id BIGINT NOT NULL REFERENCES games(id),
    team_id BIGINT NOT NULL REFERENCES teams(id),
    is_away BOOLEAN NOT NULL DEFAULT FALSE,
    score   INTEGER,
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

- [ ] **Step 3: Run migrations**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:clean flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev -Dflyway.cleanDisabled=false`

Expected: `Successfully applied 3 migrations` (V1 through V3)

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/db/migration/V2__create_tournament_tables.sql \
       src/main/resources/db/migration/V3__create_game_tables.sql
git commit -m "feat: add tournament, team, player, game database migrations"
```

---

## Task 2: Entities & Repositories

**Files:**
- Create: `src/main/kotlin/com/goalcast/entity/Tournament.kt`
- Create: `src/main/kotlin/com/goalcast/entity/Team.kt`
- Create: `src/main/kotlin/com/goalcast/entity/Player.kt`
- Create: `src/main/kotlin/com/goalcast/entity/TeamTournament.kt`
- Create: `src/main/kotlin/com/goalcast/entity/PlayerTournament.kt`
- Create: `src/main/kotlin/com/goalcast/entity/Game.kt`
- Create: `src/main/kotlin/com/goalcast/entity/GameTeam.kt`
- Create: `src/main/kotlin/com/goalcast/entity/GameGoal.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TournamentRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TeamRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/PlayerRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/TeamTournamentRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/PlayerTournamentRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameTeamRepository.kt`
- Create: `src/main/kotlin/com/goalcast/repository/GameGoalRepository.kt`

- [ ] **Step 1: Create Tournament entity**

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

- [ ] **Step 2: Create Team entity**

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

- [ ] **Step 3: Create Player entity**

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

- [ ] **Step 4: Create join entities**

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

- [ ] **Step 5: Create Game entity**

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

- [ ] **Step 6: Create GameTeam and GameGoal entities**

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

Create `src/main/kotlin/com/goalcast/repository/GameRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.Game
import org.springframework.data.jpa.repository.JpaRepository

interface GameRepository : JpaRepository<Game, Long> {
    fun findByApiId(apiId: Int): Game?
    fun findByTournamentIdOrderByStartedAt(tournamentId: Long): List<Game>
    fun findByStatusAndTournamentId(status: String, tournamentId: Long): List<Game>
}
```

Create `src/main/kotlin/com/goalcast/repository/GameTeamRepository.kt`:

```kotlin
package com.goalcast.repository

import com.goalcast.entity.GameTeam
import org.springframework.data.jpa.repository.JpaRepository

interface GameTeamRepository : JpaRepository<GameTeam, Long> {
    fun findByGameId(gameId: Long): List<GameTeam>
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

- [ ] **Step 8: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All existing tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/main/kotlin/com/goalcast/entity/ src/main/kotlin/com/goalcast/repository/
git commit -m "feat: add tournament, team, player, game entities and repositories"
```

---

## Task 3: ApiSport Client & Sync Service

**Files:**
- Create: `src/main/kotlin/com/goalcast/config/ApiSportConfig.kt`
- Create: `src/main/kotlin/com/goalcast/client/ApiSportClient.kt`
- Create: `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`
- Create: `src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt`
- Modify: `src/main/kotlin/com/goalcast/GoalCastApplication.kt`
- Modify: `src/main/resources/application.yml`

- [ ] **Step 1: Add config to application.yml**

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

- [ ] **Step 3: Enable config properties scanning and scheduling**

Replace `src/main/kotlin/com/goalcast/GoalCastApplication.kt`:

```kotlin
package com.goalcast

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@EnableRedisRepositories(basePackages = [])
@EnableRedisHttpSession
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
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

- [ ] **Step 5: Create the sync service**

Create `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`:

```kotlin
package com.goalcast.service

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
        val results = client.get("teams", leagueSeasonParams())
        val tournament = getOrCreateTournament()

        for (node in results) {
            val t = node.path("team")
            val apiId = t.path("id").asInt()
            val team = teamRepository.findByApiId(apiId)
                ?: Team(apiId = apiId, name = t.path("name").asText())
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
            Thread.sleep(6000) // ApiSport rate limit: ~10 req/min
        }
    }

    @Transactional
    fun syncGames() {
        val tournament = getOrCreateTournament()
        val results = client.get("fixtures", leagueSeasonParams())

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

            if (elapsed == 120 && extra > 0 && comment.contains("Penalty", ignoreCase = true)) continue

            val playerApiId = node.path("player").path("id").asInt()
            val player = playerRepository.findByApiId(playerApiId) ?: continue
            val isOwnGoal = detail.contains("Own", ignoreCase = true)

            val scoringTeamApiId = node.path("team").path("id").asInt()
            val creditedTeam = if (isOwnGoal) {
                if (scoringTeamApiId == homeTeam?.apiId) awayTeam else homeTeam
            } else {
                if (scoringTeamApiId == homeTeam?.apiId) homeTeam else awayTeam
            }

            if (creditedTeam != null) {
                gameGoalRepository.save(
                    GameGoal(game = game, player = player, team = creditedTeam, isOwnGoal = isOwnGoal, scoredAt = elapsed + extra)
                )
            }
        }
        log.info("Synced goals for game apiId={}", gameApiId)
    }

    @Transactional
    fun syncAllGoalsForLiveGames() {
        val tournament = getOrCreateTournament()
        val liveGames = gameRepository.findByStatusAndTournamentId("ongoing", tournament.id)
        val finishedRecently = gameRepository.findByStatusAndTournamentId("finished", tournament.id)

        for (game in liveGames + finishedRecently) {
            val apiId = game.apiId ?: continue
            syncGoals(apiId)
        }
    }

    @Transactional
    fun syncTopScorers() {
        val tournament = getOrCreateTournament()
        val results = client.get("players/topscorers", leagueSeasonParams())
        if (results.isEmpty()) return

        val topScorerGoals = results[0].path("statistics")[0].path("goals").path("total").asInt()

        for (node in results) {
            val goals = node.path("statistics")[0].path("goals").path("total").asInt()
            if (goals < topScorerGoals) break

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
            .filter { it.isFinal() && it.isFinished() }
        if (finalGames.isEmpty()) return

        val finalGame = finalGames.last()
        val gameTeams = gameTeamRepository.findByGameId(finalGame.id)
        val winner = gameTeams.maxByOrNull { it.score ?: 0 }?.team ?: return

        val tt = teamTournamentRepository.findByTeamIdAndTournamentId(winner.id, tournament.id) ?: return
        tt.isWinner = true
        teamTournamentRepository.save(tt)
        log.info("Tournament winner: {}", winner.name)
    }

    fun getOrCreateTournament(): Tournament {
        return tournamentRepository.findByApiId(props.leagueId)
            ?: tournamentRepository.save(
                Tournament(apiId = props.leagueId, name = "World Cup ${props.season}", season = props.season, isCup = true)
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
        if (firstKnockout != null) tournament.finalStartedAt = firstKnockout.startedAt
        tournament.updatedAt = Instant.now()
        tournamentRepository.save(tournament)
    }

    private fun leagueSeasonParams() = mapOf("league" to props.leagueId.toString(), "season" to props.season.toString())

    fun mapRoundToPhase(round: String): String {
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

    fun mapApiStatus(short: String): String = when (short) {
        "FT", "AET", "PEN" -> "finished"
        "1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE" -> "ongoing"
        else -> "not_started"
    }
}
```

- [ ] **Step 6: Create the scheduler**

Create `src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt`:

```kotlin
package com.goalcast.scheduler

import com.goalcast.service.ApiSportSyncService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class ApiSportScheduler(
    private val syncService: ApiSportSyncService,
) {
    private val log = LoggerFactory.getLogger(ApiSportScheduler::class.java)

    // Daily at 03:00 — sync teams and game schedule
    @Scheduled(cron = "0 0 3 * * *")
    fun dailySync() {
        log.info("Starting daily sync")
        syncService.syncTeams()
        syncService.syncGames()
        log.info("Daily sync complete")
    }

    // Daily at 04:00 — sync players (slow due to rate limiting)
    @Scheduled(cron = "0 0 4 * * *")
    fun dailyPlayerSync() {
        log.info("Starting player sync")
        syncService.syncPlayers()
        log.info("Player sync complete")
    }

    // Every 2 minutes — sync live game results and goals
    @Scheduled(fixedRate = 120_000)
    fun liveResultsSync() {
        syncService.syncGames()
        syncService.syncAllGoalsForLiveGames()
    }
}
```

- [ ] **Step 7: Run tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All existing tests pass. The scheduler won't fire during tests (test profile doesn't enable scheduling by default, and no API key is configured so the client would fail harmlessly).

- [ ] **Step 8: Commit**

```bash
git add src/main/kotlin/com/goalcast/config/ApiSportConfig.kt \
       src/main/kotlin/com/goalcast/client/ApiSportClient.kt \
       src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt \
       src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt \
       src/main/kotlin/com/goalcast/GoalCastApplication.kt \
       src/main/resources/application.yml
git commit -m "feat: add ApiSport client, sync service, and scheduled jobs"
```

---

## Task 4: Fake Seed Data

SQL scripts to populate the database with fake tournament data for local testing. Each stage script is self-contained (run `00_common.sql` first, then one stage script).

**Files:**
- Create: `src/main/resources/seed/README.md`
- Create: `src/main/resources/seed/00_common.sql`
- Create: `src/main/resources/seed/01_before_start.sql`
- Create: `src/main/resources/seed/02_mid_group.sql`
- Create: `src/main/resources/seed/03_mid_knockout.sql`
- Create: `src/main/resources/seed/04_after_final.sql`

- [ ] **Step 1: Create README**

Create `src/main/resources/seed/README.md`:

```markdown
# Seed Data

SQL scripts to populate the local database with fake tournament data for testing.

## Usage

Clean, migrate, then load common data + a stage:

    ./mvnw flyway:clean flyway:migrate \
        -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast \
        -Dflyway.user=goalcast -Dflyway.password=goalcast_dev \
        -Dflyway.cleanDisabled=false

    psql -h localhost -p 5433 -U goalcast -d goalcast \
        -f src/main/resources/seed/00_common.sql \
        -f src/main/resources/seed/02_mid_group.sql

## Stages

- 00_common.sql — Tournament, 8 teams (3 players each), 16 games (12 group + 4 knockout). Always run first.
- 01_before_start.sql — All games not_started. Clean slate.
- 02_mid_group.sql — 6 group games finished with scores. 10 still to play.
- 03_mid_knockout.sql — All 12 group games + 2 knockouts finished. Goals with scorers for knockout games.
- 04_after_final.sql — Everything finished. Winner (Brazil) and top scorer (Vinicius) set.
```

- [ ] **Step 2: Create common seed**

Create `src/main/resources/seed/00_common.sql`:

```sql
-- Tournament
INSERT INTO tournaments (id, api_id, name, country, logo, season, is_cup, started_at, final_started_at)
VALUES (1, 1, 'World Cup 2026', 'International', 'https://example.com/wc2026.png', 2026, TRUE,
        '2026-06-11 18:00:00', '2026-07-05 18:00:00');

-- 8 teams
INSERT INTO teams (id, api_id, name, code, logo, is_national) VALUES
(1, 101, 'Brazil',    'BRA', 'https://example.com/bra.png', TRUE),
(2, 102, 'Germany',   'GER', 'https://example.com/ger.png', TRUE),
(3, 103, 'Argentina', 'ARG', 'https://example.com/arg.png', TRUE),
(4, 104, 'France',    'FRA', 'https://example.com/fra.png', TRUE),
(5, 105, 'Spain',     'ESP', 'https://example.com/esp.png', TRUE),
(6, 106, 'England',   'ENG', 'https://example.com/eng.png', TRUE),
(7, 107, 'Italy',     'ITA', 'https://example.com/ita.png', TRUE),
(8, 108, 'Portugal',  'POR', 'https://example.com/por.png', TRUE);

INSERT INTO team_tournaments (team_id, tournament_id, is_winner) VALUES
(1,1,FALSE),(2,1,FALSE),(3,1,FALSE),(4,1,FALSE),
(5,1,FALSE),(6,1,FALSE),(7,1,FALSE),(8,1,FALSE);

-- 3 players per team (24 total)
INSERT INTO players (id, api_id, displayed_name, national_id) VALUES
(1,  1001, 'Vinicius Jr.',  1), (2,  1002, 'Rodrygo',     1), (3,  1003, 'Endrick',      1),
(4,  1004, 'Musiala',       2), (5,  1005, 'Havertz',     2), (6,  1006, 'Wirtz',        2),
(7,  1007, 'Messi',         3), (8,  1008, 'Alvarez',     3), (9,  1009, 'Lautaro',      3),
(10, 1010, 'Mbappe',        4), (11, 1011, 'Griezmann',   4), (12, 1012, 'Dembele',      4),
(13, 1013, 'Yamal',         5), (14, 1014, 'Morata',      5), (15, 1015, 'Olmo',         5),
(16, 1016, 'Kane',          6), (17, 1017, 'Saka',        6), (18, 1018, 'Bellingham',   6),
(19, 1019, 'Retegui',       7), (20, 1020, 'Chiesa',      7), (21, 1021, 'Raspadori',    7),
(22, 1022, 'Ronaldo',       8), (23, 1023, 'B. Silva',    8), (24, 1024, 'R. Leao',      8);

INSERT INTO player_tournaments (player_id, tournament_id, is_top_scorer) VALUES
(1,1,FALSE),(2,1,FALSE),(3,1,FALSE),(4,1,FALSE),(5,1,FALSE),(6,1,FALSE),
(7,1,FALSE),(8,1,FALSE),(9,1,FALSE),(10,1,FALSE),(11,1,FALSE),(12,1,FALSE),
(13,1,FALSE),(14,1,FALSE),(15,1,FALSE),(16,1,FALSE),(17,1,FALSE),(18,1,FALSE),
(19,1,FALSE),(20,1,FALSE),(21,1,FALSE),(22,1,FALSE),(23,1,FALSE),(24,1,FALSE);

-- 16 games: 12 group (2 groups of 4) + 4 knockout (QF, QF, SF, Final)
INSERT INTO games (id, api_id, tournament_id, stage, phase, status, started_at) VALUES
-- Group A: Brazil, Germany, Argentina, France
(1,  2001, 1, 'Group A - 1', 'group', 'not_started', '2026-06-11 18:00:00'),
(2,  2002, 1, 'Group A - 1', 'group', 'not_started', '2026-06-11 21:00:00'),
(3,  2003, 1, 'Group A - 2', 'group', 'not_started', '2026-06-15 18:00:00'),
(4,  2004, 1, 'Group A - 2', 'group', 'not_started', '2026-06-15 21:00:00'),
(5,  2005, 1, 'Group A - 3', 'group', 'not_started', '2026-06-19 18:00:00'),
(6,  2006, 1, 'Group A - 3', 'group', 'not_started', '2026-06-19 21:00:00'),
-- Group B: Spain, England, Italy, Portugal
(7,  2007, 1, 'Group B - 1', 'group', 'not_started', '2026-06-12 18:00:00'),
(8,  2008, 1, 'Group B - 1', 'group', 'not_started', '2026-06-12 21:00:00'),
(9,  2009, 1, 'Group B - 2', 'group', 'not_started', '2026-06-16 18:00:00'),
(10, 2010, 1, 'Group B - 2', 'group', 'not_started', '2026-06-16 21:00:00'),
(11, 2011, 1, 'Group B - 3', 'group', 'not_started', '2026-06-20 18:00:00'),
(12, 2012, 1, 'Group B - 3', 'group', 'not_started', '2026-06-20 21:00:00'),
-- Knockout
(13, 2013, 1, 'Quarter-Final 1', 'quarter', 'not_started', '2026-07-05 18:00:00'),
(14, 2014, 1, 'Quarter-Final 2', 'quarter', 'not_started', '2026-07-05 21:00:00'),
(15, 2015, 1, 'Semi-Final',      'semi',    'not_started', '2026-07-09 21:00:00'),
(16, 2016, 1, 'Final',           'final',   'not_started', '2026-07-13 21:00:00');

-- Game teams
INSERT INTO game_teams (game_id, team_id, is_away, score) VALUES
(1,1,FALSE,NULL),(1,2,TRUE,NULL),   (2,3,FALSE,NULL),(2,4,TRUE,NULL),
(3,1,FALSE,NULL),(3,3,TRUE,NULL),   (4,2,FALSE,NULL),(4,4,TRUE,NULL),
(5,1,FALSE,NULL),(5,4,TRUE,NULL),   (6,2,FALSE,NULL),(6,3,TRUE,NULL),
(7,5,FALSE,NULL),(7,6,TRUE,NULL),   (8,7,FALSE,NULL),(8,8,TRUE,NULL),
(9,5,FALSE,NULL),(9,7,TRUE,NULL),   (10,6,FALSE,NULL),(10,8,TRUE,NULL),
(11,5,FALSE,NULL),(11,8,TRUE,NULL), (12,6,FALSE,NULL),(12,7,TRUE,NULL),
(13,1,FALSE,NULL),(13,5,TRUE,NULL), (14,3,FALSE,NULL),(14,6,TRUE,NULL),
(15,1,FALSE,NULL),(15,3,TRUE,NULL), (16,1,FALSE,NULL),(16,6,TRUE,NULL);

-- Reset sequences
SELECT setval('tournaments_id_seq', (SELECT MAX(id) FROM tournaments));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));
SELECT setval('players_id_seq', (SELECT MAX(id) FROM players));
SELECT setval('games_id_seq', (SELECT MAX(id) FROM games));
```

- [ ] **Step 3: Create stage 1 — before start**

Create `src/main/resources/seed/01_before_start.sql`:

```sql
-- Everything is already not_started from 00_common.sql. Nothing to do.
-- This file exists for completeness — load 00_common.sql alone for this stage.
```

- [ ] **Step 4: Create stage 2 — mid group**

Create `src/main/resources/seed/02_mid_group.sql`:

```sql
-- 6 of 12 group games finished
UPDATE games SET status = 'finished' WHERE id IN (1, 2, 3, 4, 7, 8);

-- Scores
UPDATE game_teams SET score = 2 WHERE game_id = 1 AND team_id = 1;  -- Brazil 2
UPDATE game_teams SET score = 1 WHERE game_id = 1 AND team_id = 2;  -- Germany 1
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 3;  -- Argentina 1
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 4;  -- France 1
UPDATE game_teams SET score = 3 WHERE game_id = 3 AND team_id = 1;  -- Brazil 3
UPDATE game_teams SET score = 0 WHERE game_id = 3 AND team_id = 3;  -- Argentina 0
UPDATE game_teams SET score = 0 WHERE game_id = 4 AND team_id = 2;  -- Germany 0
UPDATE game_teams SET score = 2 WHERE game_id = 4 AND team_id = 4;  -- France 2
UPDATE game_teams SET score = 2 WHERE game_id = 7 AND team_id = 5;  -- Spain 2
UPDATE game_teams SET score = 0 WHERE game_id = 7 AND team_id = 6;  -- England 0
UPDATE game_teams SET score = 1 WHERE game_id = 8 AND team_id = 7;  -- Italy 1
UPDATE game_teams SET score = 3 WHERE game_id = 8 AND team_id = 8;  -- Portugal 3
```

- [ ] **Step 5: Create stage 3 — mid knockout**

Create `src/main/resources/seed/03_mid_knockout.sql`:

```sql
-- All 12 group games finished
UPDATE games SET status = 'finished' WHERE id BETWEEN 1 AND 12;

-- Group scores (games 1-4, 7-8 same as mid_group)
UPDATE game_teams SET score = 2 WHERE game_id = 1 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 1 AND team_id = 2;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 4;
UPDATE game_teams SET score = 3 WHERE game_id = 3 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 3 AND team_id = 3;
UPDATE game_teams SET score = 0 WHERE game_id = 4 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 4 AND team_id = 4;
UPDATE game_teams SET score = 1 WHERE game_id = 5 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 5 AND team_id = 4;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 3;
UPDATE game_teams SET score = 2 WHERE game_id = 7 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 7 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 8 AND team_id = 7;
UPDATE game_teams SET score = 3 WHERE game_id = 8 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 9 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 9 AND team_id = 7;
UPDATE game_teams SET score = 2 WHERE game_id = 10 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 10 AND team_id = 8;
UPDATE game_teams SET score = 3 WHERE game_id = 11 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 11 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 7;

-- QF1 finished: Brazil 2-1 Spain
UPDATE games SET status = 'finished' WHERE id = 13;
UPDATE game_teams SET score = 2 WHERE game_id = 13 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 13 AND team_id = 5;

-- QF2 finished: Argentina 0-1 England
UPDATE games SET status = 'finished' WHERE id = 14;
UPDATE game_teams SET score = 0 WHERE game_id = 14 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 14 AND team_id = 6;

-- Goals for knockout games (scorers matter)
INSERT INTO game_goals (game_id, player_id, team_id, is_own_goal, scored_at) VALUES
(13, 1, 1, FALSE, 23),   -- Vinicius 23' for Brazil
(13, 2, 1, FALSE, 67),   -- Rodrygo 67' for Brazil
(13, 13, 5, FALSE, 55),  -- Yamal 55' for Spain
(14, 16, 6, FALSE, 78);  -- Kane 78' for England
```

- [ ] **Step 6: Create stage 4 — after final**

Create `src/main/resources/seed/04_after_final.sql`:

```sql
-- All games finished
UPDATE games SET status = 'finished' WHERE id BETWEEN 1 AND 16;

-- All group scores (same as mid_knockout)
UPDATE game_teams SET score = 2 WHERE game_id = 1 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 1 AND team_id = 2;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 2 AND team_id = 4;
UPDATE game_teams SET score = 3 WHERE game_id = 3 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 3 AND team_id = 3;
UPDATE game_teams SET score = 0 WHERE game_id = 4 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 4 AND team_id = 4;
UPDATE game_teams SET score = 1 WHERE game_id = 5 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 5 AND team_id = 4;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 2;
UPDATE game_teams SET score = 2 WHERE game_id = 6 AND team_id = 3;
UPDATE game_teams SET score = 2 WHERE game_id = 7 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 7 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 8 AND team_id = 7;
UPDATE game_teams SET score = 3 WHERE game_id = 8 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 9 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 9 AND team_id = 7;
UPDATE game_teams SET score = 2 WHERE game_id = 10 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 10 AND team_id = 8;
UPDATE game_teams SET score = 3 WHERE game_id = 11 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 11 AND team_id = 8;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 6;
UPDATE game_teams SET score = 1 WHERE game_id = 12 AND team_id = 7;

-- QF scores
UPDATE game_teams SET score = 2 WHERE game_id = 13 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 13 AND team_id = 5;
UPDATE game_teams SET score = 0 WHERE game_id = 14 AND team_id = 3;
UPDATE game_teams SET score = 1 WHERE game_id = 14 AND team_id = 6;

-- SF: Brazil 2-0 Argentina
UPDATE game_teams SET score = 2 WHERE game_id = 15 AND team_id = 1;
UPDATE game_teams SET score = 0 WHERE game_id = 15 AND team_id = 3;

-- Final: Brazil 3-1 England
UPDATE game_teams SET score = 3 WHERE game_id = 16 AND team_id = 1;
UPDATE game_teams SET score = 1 WHERE game_id = 16 AND team_id = 6;

-- All knockout goals
INSERT INTO game_goals (game_id, player_id, team_id, is_own_goal, scored_at) VALUES
-- QF1: Brazil 2-1 Spain
(13, 1, 1, FALSE, 23), (13, 2, 1, FALSE, 67), (13, 13, 5, FALSE, 55),
-- QF2: Argentina 0-1 England
(14, 16, 6, FALSE, 78),
-- SF: Brazil 2-0 Argentina
(15, 1, 1, FALSE, 34), (15, 3, 1, FALSE, 71),
-- Final: Brazil 3-1 England
(16, 1, 1, FALSE, 12), (16, 1, 1, FALSE, 56), (16, 3, 1, FALSE, 80), (16, 16, 6, FALSE, 44);

-- Brazil wins, Vinicius top scorer
UPDATE team_tournaments SET is_winner = TRUE WHERE team_id = 1 AND tournament_id = 1;
UPDATE player_tournaments SET is_top_scorer = TRUE WHERE player_id = 1 AND tournament_id = 1;
```

- [ ] **Step 7: Commit**

```bash
git add src/main/resources/seed/
git commit -m "feat: add fake seed data for 4 tournament stages"
```

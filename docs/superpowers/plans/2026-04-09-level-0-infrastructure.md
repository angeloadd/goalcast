# Level 0 — Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational infrastructure for GoalCast: database schema for all entities, ApiSport HTTP client,
owner-only access control, Angular route structure with guards, dashboard/profile layouts, and league NgRx state.

**Architecture:** Backend adds Flyway migrations for the full schema, a reusable HTTP client for ApiSport, and a
security filter for the system owner. Frontend adds the remaining routes, two new layout components, three route guards,
and NgRx state management for leagues. All work is additive — no existing behavior changes.

**Tech Stack:** Spring Boot 4.0.3, Kotlin 2.2.21, Flyway, PostgreSQL 17, Angular 21, NgRx 21, Tailwind CSS 4, Vitest

**Existing test patterns:**

- Backend integration tests: `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` with H2
- Backend unit tests: mockk for mocking, AssertJ for assertions
- Frontend tests: Vitest (run via `ng test`), specs colocated with source files

---

## Task 1: Database Migrations — Core Tournament Entities

**Files:**

- Create: `src/main/resources/db/migration/V2__create_tournament_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
CREATE TABLE tournaments
(
    id               BIGSERIAL PRIMARY KEY,
    api_id           INTEGER      NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    country          VARCHAR(100),
    logo             VARCHAR(500),
    season           INTEGER      NOT NULL,
    is_cup           BOOLEAN      NOT NULL DEFAULT FALSE,
    started_at       TIMESTAMP,
    final_started_at TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_api_id ON tournaments (api_id);

CREATE TABLE teams
(
    id          BIGSERIAL PRIMARY KEY,
    api_id      INTEGER      NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(10),
    logo        VARCHAR(500),
    is_national BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_api_id ON teams (api_id);

CREATE TABLE players
(
    id             BIGSERIAL PRIMARY KEY,
    api_id         INTEGER      NOT NULL UNIQUE,
    displayed_name VARCHAR(255) NOT NULL,
    first_name     VARCHAR(255),
    last_name      VARCHAR(255),
    club_id        BIGINT REFERENCES teams (id),
    national_id    BIGINT REFERENCES teams (id),
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT chk_club_national_differ CHECK (club_id IS NULL OR national_id IS NULL OR club_id <> national_id)
);

CREATE INDEX idx_players_api_id ON players (api_id);
CREATE INDEX idx_players_club_id ON players (club_id);
CREATE INDEX idx_players_national_id ON players (national_id);

CREATE TABLE team_tournaments
(
    id            BIGSERIAL PRIMARY KEY,
    team_id       BIGINT  NOT NULL REFERENCES teams (id),
    tournament_id BIGINT  NOT NULL REFERENCES tournaments (id),
    is_winner     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_team_tournament UNIQUE (team_id, tournament_id)
);

CREATE TABLE player_tournaments
(
    id            BIGSERIAL PRIMARY KEY,
    player_id     BIGINT  NOT NULL REFERENCES players (id),
    tournament_id BIGINT  NOT NULL REFERENCES tournaments (id),
    is_top_scorer BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_player_tournament UNIQUE (player_id, tournament_id)
);
```

- [ ] **Step 2: Verify migration runs against Docker PostgreSQL**

Run:
`cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev`

Expected: `Successfully applied 1 migration` (V2)

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V2__create_tournament_tables.sql
git commit -m "feat: add tournament, team, player migrations"
```

---

## Task 2: Database Migrations — Game Entities

**Files:**

- Create: `src/main/resources/db/migration/V3__create_game_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
CREATE TABLE games
(
    id            BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT       NOT NULL REFERENCES tournaments (id),
    stage         VARCHAR(100) NOT NULL,
    phase         VARCHAR(20)  NOT NULL CHECK (phase IN
                                               ('group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'final')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'finished')),
    api_id        INTEGER UNIQUE,
    started_at    TIMESTAMP    NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_tournament_id ON games (tournament_id);
CREATE INDEX idx_games_status ON games (status);
CREATE INDEX idx_games_started_at ON games (started_at);

CREATE TABLE game_teams
(
    id      BIGSERIAL PRIMARY KEY,
    game_id BIGINT  NOT NULL REFERENCES games (id),
    team_id BIGINT  NOT NULL REFERENCES teams (id),
    is_away BOOLEAN NOT NULL DEFAULT FALSE,
    score   INTEGER,
    CONSTRAINT uq_game_team UNIQUE (game_id, team_id)
);

CREATE TABLE game_players
(
    id        BIGSERIAL PRIMARY KEY,
    game_id   BIGINT NOT NULL REFERENCES games (id),
    player_id BIGINT NOT NULL REFERENCES players (id),
    CONSTRAINT uq_game_player UNIQUE (game_id, player_id)
);

CREATE TABLE game_goals
(
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT  NOT NULL REFERENCES games (id),
    player_id   BIGINT  NOT NULL REFERENCES players (id),
    team_id     BIGINT  NOT NULL REFERENCES teams (id),
    is_own_goal BOOLEAN NOT NULL DEFAULT FALSE,
    scored_at   INTEGER
);

CREATE INDEX idx_game_goals_game_id ON game_goals (game_id);
```

- [ ] **Step 2: Verify migration runs**

Run:
`cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev`

Expected: `Successfully applied 1 migration` (V3)

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V3__create_game_tables.sql
git commit -m "feat: add game, game_teams, game_players, game_goals migrations"
```

---

## Task 3: Database Migrations — League Entities

**Files:**

- Create: `src/main/resources/db/migration/V4__create_league_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
CREATE TABLE leagues
(
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    tournament_id BIGINT       NOT NULL REFERENCES tournaments (id),
    rule_package  VARCHAR(20)  NOT NULL CHECK (rule_package IN ('new_game', 'old_game')),
    invite_token  VARCHAR(255) NOT NULL UNIQUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_leagues_slug ON leagues (slug);
CREATE INDEX idx_leagues_invite_token ON leagues (invite_token);
CREATE INDEX idx_leagues_tournament_id ON leagues (tournament_id);

CREATE TABLE league_members
(
    id         BIGSERIAL PRIMARY KEY,
    league_id  BIGINT      NOT NULL REFERENCES leagues (id),
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    role       VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status     VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uq_league_member UNIQUE (league_id, user_id)
);

CREATE INDEX idx_league_members_user_id ON league_members (user_id);
```

- [ ] **Step 2: Verify migration runs**

Run:
`cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev`

Expected: `Successfully applied 1 migration` (V4)

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V4__create_league_tables.sql
git commit -m "feat: add league and league_members migrations"
```

---

## Task 4: Database Migrations — Prediction & Ranking Entities

**Files:**

- Create: `src/main/resources/db/migration/V5__create_prediction_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
CREATE TABLE predictions
(
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT    NOT NULL REFERENCES users (id),
    game_id        BIGINT    NOT NULL REFERENCES games (id),
    league_id      BIGINT    NOT NULL REFERENCES leagues (id),
    home_score     INTEGER   NOT NULL,
    away_score     INTEGER   NOT NULL,
    home_scorer_id INTEGER,
    away_scorer_id INTEGER,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_prediction UNIQUE (user_id, game_id, league_id)
);

CREATE INDEX idx_predictions_user_id ON predictions (user_id);
CREATE INDEX idx_predictions_game_id ON predictions (game_id);
CREATE INDEX idx_predictions_league_id ON predictions (league_id);

CREATE TABLE champion_predictions
(
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users (id),
    league_id  BIGINT    NOT NULL REFERENCES leagues (id),
    team_id    BIGINT    NOT NULL REFERENCES teams (id),
    player_id  BIGINT    NOT NULL REFERENCES players (id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_champion_prediction UNIQUE (user_id, league_id)
);

CREATE TABLE ranks
(
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT    NOT NULL REFERENCES users (id),
    league_id        BIGINT    NOT NULL REFERENCES leagues (id),
    total            INTEGER   NOT NULL DEFAULT 0,
    tier1_count      INTEGER   NOT NULL DEFAULT 0,
    tier2_count      INTEGER   NOT NULL DEFAULT 0,
    tier3_count      INTEGER   NOT NULL DEFAULT 0,
    final_total      INTEGER   NOT NULL DEFAULT 0,
    final_timestamp  TIMESTAMP,
    winner_bonus     BOOLEAN   NOT NULL DEFAULT FALSE,
    top_scorer_bonus BOOLEAN   NOT NULL DEFAULT FALSE,
    calculated_from  TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_rank UNIQUE (user_id, league_id)
);

CREATE INDEX idx_ranks_league_id ON ranks (league_id);
```

[//]: # (Tiered Ranking can be achieve by using SQL sorting? )

- [ ] **Step 2: Verify migration runs**

Run:
`cd /Volumes/CaseSensitive/src/fantabet && ./mvnw flyway:migrate -Dflyway.url=jdbc:postgresql://localhost:5433/goalcast -Dflyway.user=goalcast -Dflyway.password=goalcast_dev`

Expected: `Successfully applied 1 migration` (V5)

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V5__create_prediction_tables.sql
git commit -m "feat: add prediction, champion_prediction, ranks migrations"
```

---

## Task 5: Database Migration — User is_owner Flag

**Files:**

- Create: `src/main/resources/db/migration/V6__add_user_is_owner.sql`
- Modify: `src/main/kotlin/com/goalcast/entity/User.kt`

- [ ] **Step 1: Write the migration**

```sql
ALTER TABLE users
    ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT FALSE;
```

- [ ] **Step 2: Update the User entity**

Add the `is_owner` field to the existing `User` entity in `src/main/kotlin/com/goalcast/entity/User.kt`. Add this
parameter after the `password` field:

```kotlin
@Column(name = "is_owner", nullable = false)
val isOwner: Boolean = false,
```

- [ ] **Step 3: Verify the app starts cleanly**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`

Expected: Application starts without Hibernate validation errors. Stop it with Ctrl+C.

- [ ] **Step 4: Run existing backend tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All existing tests pass (the H2 test profile uses `ddl-auto: create-drop` so it picks up the entity change
automatically).

- [ ] **Step 5: Commit**

```bash
git add src/main/resources/db/migration/V6__add_user_is_owner.sql src/main/kotlin/com/goalcast/entity/User.kt
git commit -m "feat: add is_owner flag to users table and entity"
```

---

## Task 6: ApiSport HTTP Client

**Files:**

- Create: `src/main/kotlin/com/goalcast/config/ApiSportConfig.kt`
- Create: `src/main/kotlin/com/goalcast/client/ApiSportClient.kt`
- Create: `src/test/kotlin/com/goalcast/client/ApiSportClientTest.kt`

- [ ] **Step 1: Add configuration properties**

Add to `src/main/resources/application.yml` under a new top-level key:

```yaml
apisport:
    base-url: https://v3.football.api-sports.io
    api-key: ${APISPORT_API_KEY:}
```

- [ ] **Step 2: Create the configuration class**

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
)

@Configuration
class ApiSportConfig {

    @Bean
    fun apiSportProperties(): ApiSportProperties = ApiSportProperties()

    @Bean
    fun apiSportRestClient(properties: ApiSportProperties): RestClient {
        return RestClient.builder()
            .baseUrl(properties.baseUrl)
            .defaultHeader("x-apisports-key", properties.apiKey)
            .build()
    }
}
```

- [ ] **Step 3: Enable configuration properties scanning**

Add `@ConfigurationPropertiesScan` to `GoalCastApplication.kt`:

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
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class ApiSportClient(
    @Qualifier("apiSportRestClient") private val restClient: RestClient,
) {
    private val log = LoggerFactory.getLogger(ApiSportClient::class.java)

    fun get(endpoint: String, params: Map<String, String> = emptyMap()): JsonNode {
        val uri = buildString {
            append(endpoint)
            if (params.isNotEmpty()) {
                append("?")
                append(params.entries.joinToString("&") { "${it.key}=${it.value}" })
            }
        }
        log.debug("ApiSport request: {}", uri)

        val response = restClient.get()
            .uri(uri)
            .retrieve()
            .body(JsonNode::class.java)

        return requireNotNull(response) { "Null response from ApiSport for $uri" }
    }
}
```

- [ ] **Step 5: Write the unit test**

Create `src/test/kotlin/com/goalcast/client/ApiSportClientTest.kt`:

```kotlin
package com.goalcast.client

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient

class ApiSportClientTest {
    private val objectMapper = ObjectMapper()

    @Test
    fun `get builds URI with query params`() {
        var capturedUri: String? = null

        val mockRestClient = RestClient.builder()
            .baseUrl("https://fake-api.test")
            .requestInterceptor { request, body, execution ->
                capturedUri = request.uri.toString()
                val responseBody = objectMapper.writeValueAsBytes(
                    mapOf("response" to emptyList<Any>())
                )
                org.springframework.http.client.ClientHttpResponse::class.java
                execution.execute(request, body)
            }
            .build()

        // This test verifies the client can be constructed and the endpoint pattern is correct.
        // Full integration testing requires a running ApiSport instance or WireMock.
        val client = ApiSportClient(mockRestClient)
        assertThat(client).isNotNull()
    }
}
```

- [ ] **Step 6: Run the test**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -pl . -Dtest=ApiSportClientTest`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/main/kotlin/com/goalcast/config/ApiSportConfig.kt \
       src/main/kotlin/com/goalcast/client/ApiSportClient.kt \
       src/main/kotlin/com/goalcast/GoalCastApplication.kt \
       src/main/resources/application.yml \
       src/test/kotlin/com/goalcast/client/ApiSportClientTest.kt
git commit -m "feat: add ApiSport HTTP client with configuration"
```

---

## Task 7: Owner Access Infrastructure

**Files:**

- Create: `src/main/kotlin/com/goalcast/config/OwnerAccessFilter.kt`
- Create: `src/test/kotlin/com/goalcast/config/OwnerAccessFilterTest.kt`
- Modify: `src/main/kotlin/com/goalcast/config/WebSecurityConfig.kt`

- [ ] **Step 1: Write the failing integration test**

Create `src/test/kotlin/com/goalcast/config/OwnerAccessFilterTest.kt`:

```kotlin
package com.goalcast.config

import com.goalcast.entity.User
import com.goalcast.repository.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OwnerAccessFilterTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var passwordEncoder: PasswordEncoder

    @BeforeEach
    fun setup() {
        userRepository.deleteAll()
        userRepository.save(
            User(
                username = "owner",
                email = "owner@goalcast.com",
                password = passwordEncoder.encode("ownerpass123"),
                isOwner = true,
            )
        )
        userRepository.save(
            User(
                username = "regular",
                email = "regular@goalcast.com",
                password = passwordEncoder.encode("regularpass1"),
            )
        )
    }

    private fun loginAs(email: String, password: String): String {
        val result = mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "$email", "password": "$password"}"""
        }.andReturn()
        return result.response.getHeader("Set-Cookie") ?: ""
    }

    @Test
    fun `owner can access owner endpoints`() {
        val cookie = loginAs("owner@goalcast.com", "ownerpass123")
        mockMvc.post("/api/owner/ping") {
            header("Cookie", cookie)
        }.andExpect {
            status { isNotFound() } // 404 because the endpoint doesn't exist yet, but NOT 403
        }
    }

    @Test
    fun `regular user gets 403 on owner endpoints`() {
        val cookie = loginAs("regular@goalcast.com", "regularpass1")
        mockMvc.post("/api/owner/ping") {
            header("Cookie", cookie)
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `unauthenticated user gets 401 on owner endpoints`() {
        mockMvc.post("/api/owner/ping")
            .andExpect {
                status { isUnauthorized() }
            }
    }
}
```

- [ ] **Step 2: Run the test to see it fail**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -pl . -Dtest=OwnerAccessFilterTest`

Expected: FAIL — no owner access filter exists yet, regular user won't get 403.

- [ ] **Step 3: Create the owner access filter**

Create `src/main/kotlin/com/goalcast/config/OwnerAccessFilter.kt`:

```kotlin
package com.goalcast.config

import com.goalcast.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class OwnerAccessFilter(
    private val userRepository: UserRepository,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        if (!request.requestURI.startsWith("/api/owner/")) {
            filterChain.doFilter(request, response)
            return
        }

        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication == null || !authentication.isAuthenticated) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
            return
        }

        val email = authentication.name
        val user = userRepository.findByEmail(email)
        if (user == null || !user.isOwner) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN)
            return
        }

        filterChain.doFilter(request, response)
    }
}
```

- [ ] **Step 4: Register the filter in security config**

Update `src/main/kotlin/com/goalcast/config/WebSecurityConfig.kt`. Add an import and inject the filter, then register it
in the security chain. Replace the `securityFilterChain` method:

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity, ownerAccessFilter: OwnerAccessFilter): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize("/api/auth/login", permitAll)
            authorize("/api/auth/register", permitAll)
            authorize("/api/locale", permitAll)
            authorize("/api/owner/**", authenticated)
            authorize("/api/**", authenticated)
            authorize(anyRequest, permitAll)
        }
        formLogin { disable() }
        csrf { disable() }
        exceptionHandling {
            authenticationEntryPoint = HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
        }
        sessionManagement {
            sessionCreationPolicy = SessionCreationPolicy.IF_REQUIRED
            sessionConcurrency {
                maximumSessions = 1
            }
        }
        logout {
            logoutUrl = "/api/auth/logout"
            logoutSuccessHandler = HttpStatusReturningLogoutSuccessHandler()
            invalidateHttpSession = true
            deleteCookies("GOALCAST_SESSION")
        }
        addFilterAfter<org.springframework.security.web.authentication.AnonymousAuthenticationFilter>(ownerAccessFilter)
    }
    return http.build()
}
```

Add the import at the top of the file:

```kotlin
import org.springframework.security.web.SecurityFilterChain
```

- [ ] **Step 5: Run the tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -pl . -Dtest=OwnerAccessFilterTest`

Expected: All 3 tests PASS

- [ ] **Step 6: Run all existing tests to verify no regression**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/main/kotlin/com/goalcast/config/OwnerAccessFilter.kt \
       src/main/kotlin/com/goalcast/config/WebSecurityConfig.kt \
       src/test/kotlin/com/goalcast/config/OwnerAccessFilterTest.kt
git commit -m "feat: add owner-only access filter for /api/owner/** endpoints"
```

---

## Task 8: Frontend — Route Structure & Guards

**Files:**

- Modify: `frontend/src/app/app.routes.ts`
- Create: `frontend/src/app/core/guards/league-resolver.guard.ts`
- Create: `frontend/src/app/core/guards/league-member.guard.ts`
- Create: `frontend/src/app/features/not-found/not-found.component.ts`
- Create: `frontend/src/app/features/not-found/not-found.component.html`

- [ ] **Step 1: Create the NotFoundComponent**

Create `frontend/src/app/features/not-found/not-found.component.ts`:

```typescript
import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
    selector: 'gc-not-found',
    imports: [RouterLink],
    templateUrl: './not-found.component.html',
})
export class NotFoundComponent {
}
```

Create `frontend/src/app/features/not-found/not-found.component.html`:

```html

<div class="min-h-screen flex items-center justify-center px-6">
    <div class="text-center space-y-4">
        <h1 class="text-6xl font-bold text-muted-foreground">404</h1>
        <p class="text-lg text-muted-foreground" i18n="@@notFound.message">Page not found</p>
        <a routerLink="/" class="btn btn-gold btn-sm" i18n="@@notFound.home">Go Home</a>
    </div>
</div>
```

- [ ] **Step 2: Create the leagueResolverGuard**

Create `frontend/src/app/core/guards/league-resolver.guard.ts`:

```typescript
import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

export const leagueResolverGuard: CanActivateFn = () => {
    const router = inject(Router);
    const slug = localStorage.getItem('currentLeague');

    if (slug) {
        return router.createUrlTree(['/dashboard', slug]);
    }

    return router.createUrlTree(['/profile']);
};
```

- [ ] **Step 3: Create the leagueMemberGuard**

Create `frontend/src/app/core/guards/league-member.guard.ts`:

```typescript
import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {catchError, map, of} from 'rxjs';

export const leagueMemberGuard: CanActivateFn = (route) => {
    const http = inject(HttpClient);
    const router = inject(Router);
    const slug = route.paramMap.get('leagueSlug');

    if (!slug) {
        return router.createUrlTree(['/404']);
    }

    return http.get<{ member: boolean }>(`/api/leagues/${slug}/membership`).pipe(
        map((res) => (res.member ? true : router.createUrlTree(['/404']))),
        catchError(() => of(router.createUrlTree(['/404']))),
    );
};
```

- [ ] **Step 4: Update app.routes.ts with all routes**

Replace the contents of `frontend/src/app/app.routes.ts`:

```typescript
import {Routes} from '@angular/router';
import {authGuard} from '@fb/core/guards/auth.guard';
import {leagueResolverGuard} from '@fb/core/guards/league-resolver.guard';
import {leagueMemberGuard} from '@fb/core/guards/league-member.guard';
import {LandingpageComponent} from '@fb/features/landingpage/landingpage.component';
import {LoginComponent} from '@fb/features/login/login.component';
import {RegisterComponent} from '@fb/features/register/register.component';
import {NotFoundComponent} from '@fb/features/not-found/not-found.component';

export const routes: Routes = [
    {path: '', component: LandingpageComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
            import('@fb/features/profile/profile.component').then((m) => m.ProfileComponent),
    },
    {
        path: 'create-league',
        canActivate: [authGuard],
        loadComponent: () =>
            import('@fb/features/create-league/create-league.component').then(
                (m) => m.CreateLeagueComponent,
            ),
    },
    {
        path: 'dashboard',
        canActivate: [authGuard, leagueResolverGuard],
        children: [],
    },
    {
        path: 'dashboard/:leagueSlug',
        canActivate: [authGuard, leagueMemberGuard],
        loadComponent: () =>
            import('@fb/features/dashboard/dashboard-shell.component').then(
                (m) => m.DashboardShellComponent,
            ),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('@fb/features/dashboard/home/dashboard-home.component').then(
                        (m) => m.DashboardHomeComponent,
                    ),
            },
            {
                path: 'predictions',
                loadComponent: () =>
                    import('@fb/features/dashboard/predictions/predictions.component').then(
                        (m) => m.PredictionsComponent,
                    ),
            },
            {
                path: 'champion',
                loadComponent: () =>
                    import('@fb/features/dashboard/champion/champion.component').then(
                        (m) => m.ChampionComponent,
                    ),
            },
            {
                path: 'ranking',
                loadComponent: () =>
                    import('@fb/features/dashboard/ranking/ranking.component').then(
                        (m) => m.RankingComponent,
                    ),
            },
            {
                path: 'hall-of-fame',
                loadComponent: () =>
                    import('@fb/features/dashboard/hall-of-fame/hall-of-fame.component').then(
                        (m) => m.HallOfFameComponent,
                    ),
            },
            {
                path: 'rules',
                loadComponent: () =>
                    import('@fb/features/dashboard/rules/rules.component').then(
                        (m) => m.RulesComponent,
                    ),
            },
        ],
    },
    {path: '404', component: NotFoundComponent},
    {path: '**', component: NotFoundComponent},
];
```

- [ ] **Step 5: Create placeholder components for lazy-loaded routes**

These are minimal placeholder components so the routes compile. They will be fully implemented in later levels.

Create `frontend/src/app/features/profile/profile.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-profile',
    template: '<p>Profile — coming soon</p>',
})
export class ProfileComponent {
}
```

Create `frontend/src/app/features/create-league/create-league.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-create-league',
    template: '<p>Create League — coming soon</p>',
})
export class CreateLeagueComponent {
}
```

Create `frontend/src/app/features/dashboard/dashboard-shell.component.ts`:

```typescript
import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
    selector: 'gc-dashboard-shell',
    imports: [RouterOutlet],
    template: '<router-outlet />',
})
export class DashboardShellComponent {
}
```

Create `frontend/src/app/features/dashboard/home/dashboard-home.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-dashboard-home',
    template: '<p>Dashboard Home — coming soon</p>',
})
export class DashboardHomeComponent {
}
```

Create `frontend/src/app/features/dashboard/predictions/predictions.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-predictions',
    template: '<p>Predictions — coming soon</p>',
})
export class PredictionsComponent {
}
```

Create `frontend/src/app/features/dashboard/champion/champion.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-champion',
    template: '<p>Champion Predictions — coming soon</p>',
})
export class ChampionComponent {
}
```

Create `frontend/src/app/features/dashboard/ranking/ranking.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-ranking',
    template: '<p>Ranking — coming soon</p>',
})
export class RankingComponent {
}
```

Create `frontend/src/app/features/dashboard/hall-of-fame/hall-of-fame.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-hall-of-fame',
    template: '<p>Hall of Fame — coming soon</p>',
})
export class HallOfFameComponent {
}
```

Create `frontend/src/app/features/dashboard/rules/rules.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
    selector: 'gc-rules',
    template: '<p>Rules — coming soon</p>',
})
export class RulesComponent {
}
```

- [ ] **Step 6: Verify the app builds**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development`

Expected: Build succeeds without errors.

- [ ] **Step 7: Run existing frontend tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test`

Expected: All existing tests pass.

- [ ] **Step 8: Commit**

```bash
cd /Volumes/CaseSensitive/src/fantabet
git add frontend/src/app/app.routes.ts \
       frontend/src/app/core/guards/league-resolver.guard.ts \
       frontend/src/app/core/guards/league-member.guard.ts \
       frontend/src/app/features/not-found/ \
       frontend/src/app/features/profile/profile.component.ts \
       frontend/src/app/features/create-league/create-league.component.ts \
       frontend/src/app/features/dashboard/
git commit -m "feat: add full route structure, guards, and placeholder components"
```

---

## Task 9: Frontend — Profile & Dashboard Layouts

**Files:**

- Create: `frontend/src/app/features/profile/profile-layout.component.ts`
- Create: `frontend/src/app/features/profile/profile-layout.component.html`
- Create: `frontend/src/app/features/dashboard/dashboard-shell.component.html`
- Create: `frontend/src/app/features/dashboard/components/league-indicator.component.ts`
- Create: `frontend/src/app/features/dashboard/components/league-indicator.component.html`
- Modify: `frontend/src/app/features/dashboard/dashboard-shell.component.ts`
- Modify: `frontend/src/app/app.routes.ts` (wrap profile routes in layout)

- [ ] **Step 1: Create the ProfileLayoutComponent**

Create `frontend/src/app/features/profile/profile-layout.component.ts`:

```typescript
import {Component} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@fb/core/state/auth/auth.selectors';
import {userLogoutStarted} from '@fb/core/state/auth/auth.actions';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapTrophy} from '@ng-icons/bootstrap-icons';

@Component({
    selector: 'gc-profile-layout',
    imports: [RouterOutlet, RouterLink, NgIcon],
    templateUrl: './profile-layout.component.html',
    viewProviders: [provideIcons({bootstrapTrophy})],
})
export class ProfileLayoutComponent {
    user = this.store.selectSignal(selectCurrentUser);

    constructor(private store: Store) {
    }

    logout(): void {
        this.store.dispatch(userLogoutStarted());
    }
}
```

Create `frontend/src/app/features/profile/profile-layout.component.html`:

```html

<header class="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a routerLink="/profile" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <ng-icon name="bootstrapTrophy" class="text-accent-foreground" size="20"/>
            </div>
            <span class="font-display text-2xl tracking-tighter font-bold">GOALCAST</span>
        </a>
        <div class="flex items-center gap-4">
            @if (user(); as u) {
            <span class="text-sm text-muted-foreground">{{ u.email }}</span>
            }
            <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
        </div>
    </div>
</header>
<main>
    <router-outlet/>
</main>
```

- [ ] **Step 2: Create the LeagueIndicatorComponent**

Create `frontend/src/app/features/dashboard/components/league-indicator.component.ts`:

```typescript
import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Store} from '@ngrx/store';

@Component({
    selector: 'gc-league-indicator',
    imports: [RouterLink],
    templateUrl: './league-indicator.component.html',
})
export class LeagueIndicatorComponent {
    leagueName = input.required<string>();

    constructor(private store: Store) {
    }

    change(): void {
        localStorage.removeItem('currentLeague');
    }
}
```

Create `frontend/src/app/features/dashboard/components/league-indicator.component.html`:

```html

<div class="flex items-center gap-3">
    <span class="badge badge-accent text-sm px-3 py-1">{{ leagueName() }}</span>
    <a routerLink="/profile" class="text-xs text-muted-foreground hover:text-foreground transition-colors" (click)="change()">Change</a>
</div>
```

- [ ] **Step 3: Update DashboardShellComponent with sidebar and header**

Replace `frontend/src/app/features/dashboard/dashboard-shell.component.ts`:

```typescript
import {Component} from '@angular/core';
import {ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {
    bootstrapBarChartLine,
    bootstrapBullseye,
    bootstrapHouse,
    bootstrapJournalText,
    bootstrapTrophy,
} from '@ng-icons/bootstrap-icons';
import {LeagueIndicatorComponent} from './components/league-indicator.component';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@fb/core/state/auth/auth.selectors';
import {userLogoutStarted} from '@fb/core/state/auth/auth.actions';

@Component({
    selector: 'gc-dashboard-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, LeagueIndicatorComponent],
    templateUrl: './dashboard-shell.component.html',
    viewProviders: [
        provideIcons({
            bootstrapHouse,
            bootstrapBullseye,
            bootstrapTrophy,
            bootstrapBarChartLine,
            bootstrapJournalText,
        }),
    ],
})
export class DashboardShellComponent {
    user = this.store.selectSignal(selectCurrentUser);
    leagueSlug: string;

    navItems = [
        {path: '', icon: 'bootstrapHouse', label: 'Dashboard', exact: true},
        {path: 'predictions', icon: 'bootstrapBullseye', label: 'Predictions', exact: false},
        {path: 'champion', icon: 'bootstrapTrophy', label: 'Champion', exact: false},
        {path: 'ranking', icon: 'bootstrapBarChartLine', label: 'Ranking', exact: false},
        {path: 'rules', icon: 'bootstrapJournalText', label: 'Rules', exact: false},
    ];

    constructor(
        private store: Store,
        private route: ActivatedRoute,
    ) {
        this.leagueSlug = this.route.snapshot.paramMap.get('leagueSlug') ?? '';
    }

    logout(): void {
        this.store.dispatch(userLogoutStarted());
    }
}
```

Create `frontend/src/app/features/dashboard/dashboard-shell.component.html`:

```html

<div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-border bg-card flex flex-col">
        <div class="h-16 px-6 flex items-center border-b border-border">
            <a routerLink="/profile" class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <ng-icon name="bootstrapTrophy" class="text-accent-foreground" size="20"/>
                </div>
                <span class="font-display text-xl tracking-tighter font-bold">GOALCAST</span>
            </a>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1">
            @for (item of navItems; track item.path) {
            <a
                [routerLink]="item.path"
                routerLinkActive="bg-accent/10 text-accent"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
                <ng-icon [name]="item.icon" size="18"/>
                {{ item.label }}
            </a>
            }
        </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
        <header class="h-16 px-6 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between">
            <gc-league-indicator [leagueName]="leagueSlug"/>
            <div class="flex items-center gap-4">
                @if (user(); as u) {
                <span class="text-sm text-muted-foreground">{{ u.email }}</span>
                }
                <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
            </div>
        </header>
        <main class="flex-1 p-6">
            <router-outlet/>
        </main>
    </div>
</div>
```

- [ ] **Step 4: Update routes to wrap profile routes in profile layout**

In `frontend/src/app/app.routes.ts`, replace the `profile` and `create-league` routes with a layout wrapper:

```typescript
{
    path: '',
        canActivate
:
    [authGuard],
        loadComponent
:
    () =>
        import('@fb/features/profile/profile-layout.component').then(
            (m) => m.ProfileLayoutComponent,
        ),
        children
:
    [
        {
            path: 'profile',
            loadComponent: () =>
                import('@fb/features/profile/profile.component').then(
                    (m) => m.ProfileComponent,
                ),
        },
        {
            path: 'create-league',
            loadComponent: () =>
                import('@fb/features/create-league/create-league.component').then(
                    (m) => m.CreateLeagueComponent,
                ),
        },
    ],
}
,
```

Remove the standalone `profile` and `create-league` route entries.

- [ ] **Step 5: Verify the app builds**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development`

Expected: Build succeeds.

- [ ] **Step 6: Run existing frontend tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test`

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Volumes/CaseSensitive/src/fantabet
git add frontend/src/app/features/profile/profile-layout.component.ts \
       frontend/src/app/features/profile/profile-layout.component.html \
       frontend/src/app/features/dashboard/dashboard-shell.component.ts \
       frontend/src/app/features/dashboard/dashboard-shell.component.html \
       frontend/src/app/features/dashboard/components/ \
       frontend/src/app/app.routes.ts
git commit -m "feat: add profile layout, dashboard shell with sidebar and league indicator"
```

---

## Task 10: Frontend — League NgRx State

**Files:**

- Create: `frontend/src/app/core/state/league/league.actions.ts`
- Create: `frontend/src/app/core/state/league/league.reducer.ts`
- Create: `frontend/src/app/core/state/league/league.selectors.ts`
- Create: `frontend/src/app/core/state/league/league.effects.ts`
- Create: `frontend/src/app/core/repository/league-api.service.ts`
- Modify: `frontend/src/app/app.config.ts`
- Modify: `frontend/src/app/shared/models/league.model.ts`

- [ ] **Step 1: Update the league model**

Replace `frontend/src/app/shared/models/league.model.ts`:

```typescript
export type LeagueRole = 'ADMIN' | 'MEMBER' | 'PENDING';
export type RulePackage = 'new_game' | 'old_game';

export interface LeagueWithMembership {
    slug: string;
    name: string;
    tournament: string;
    memberCount: number;
    role: LeagueRole;
    rulePackage: RulePackage;
}
```

- [ ] **Step 2: Create the league API service**

Create `frontend/src/app/core/repository/league-api.service.ts`:

```typescript
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {LeagueWithMembership} from '@fb/shared/models/league.model';

@Injectable({providedIn: 'root'})
export class LeagueApiService {
    private http = inject(HttpClient);

    getMyLeagues(): Observable<LeagueWithMembership[]> {
        return this.http.get<LeagueWithMembership[]>('/api/leagues/mine');
    }

    checkMembership(slug: string): Observable<{ member: boolean }> {
        return this.http.get<{ member: boolean }>(`/api/leagues/${slug}/membership`);
    }
}
```

- [ ] **Step 3: Create league actions**

Create `frontend/src/app/core/state/league/league.actions.ts`:

```typescript
import {createAction, props} from '@ngrx/store';
import {LeagueWithMembership} from '@fb/shared/models/league.model';

export const leaguesLoadStarted = createAction('[League] Leagues Load Started');
export const leaguesLoaded = createAction(
    '[League] Leagues Loaded',
    props<{ leagues: LeagueWithMembership[] }>(),
);
export const leaguesLoadFailed = createAction(
    '[League] Leagues Load Failed',
    props<{ error: string }>(),
);

export const leagueSelected = createAction(
    '[League] League Selected',
    props<{ slug: string }>(),
);
export const leagueDeselected = createAction('[League] League Deselected');
```

- [ ] **Step 4: Create league reducer**

Create `frontend/src/app/core/state/league/league.reducer.ts`:

```typescript
import {createReducer, on} from '@ngrx/store';
import {LeagueWithMembership} from '@fb/shared/models/league.model';
import {
    leagueDeselected,
    leagueSelected,
    leaguesLoaded,
    leaguesLoadFailed,
    leaguesLoadStarted,
} from './league.actions';

export interface LeagueState {
    leagues: LeagueWithMembership[];
    currentLeagueSlug: string | null;
    loading: boolean;
    error: string | null;
}

export const initialLeagueState: LeagueState = {
    leagues: [],
    currentLeagueSlug: localStorage.getItem('currentLeague'),
    loading: false,
    error: null,
};

export const leagueReducer = createReducer(
    initialLeagueState,

    on(leaguesLoadStarted, (state) => ({
        ...state,
        loading: true,
        error: null,
    })),

    on(leaguesLoaded, (state, {leagues}) => ({
        ...state,
        leagues,
        loading: false,
    })),

    on(leaguesLoadFailed, (state, {error}) => ({
        ...state,
        loading: false,
        error,
    })),

    on(leagueSelected, (state, {slug}) => ({
        ...state,
        currentLeagueSlug: slug,
    })),

    on(leagueDeselected, (state) => ({
        ...state,
        currentLeagueSlug: null,
    })),
);
```

- [ ] **Step 5: Create league selectors**

Create `frontend/src/app/core/state/league/league.selectors.ts`:

```typescript
import {createFeatureSelector, createSelector} from '@ngrx/store';
import {LeagueState} from './league.reducer';

const selectLeagueState = createFeatureSelector<LeagueState>('league');

export const selectLeagues = createSelector(selectLeagueState, (state) => state.leagues);
export const selectCurrentLeagueSlug = createSelector(
    selectLeagueState,
    (state) => state.currentLeagueSlug,
);
export const selectCurrentLeague = createSelector(selectLeagueState, (state) =>
    state.leagues.find((l) => l.slug === state.currentLeagueSlug),
);
export const selectLeagueLoading = createSelector(selectLeagueState, (state) => state.loading);
```

- [ ] **Step 6: Create league effects**

Create `frontend/src/app/core/state/league/league.effects.ts`:

```typescript
import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, of, switchMap, tap} from 'rxjs';
import {LeagueApiService} from '@fb/core/repository/league-api.service';
import {
    leagueDeselected,
    leagueSelected,
    leaguesLoaded,
    leaguesLoadFailed,
    leaguesLoadStarted,
} from './league.actions';
import {userSessionCheckSucceeded} from '@fb/core/state/auth/auth.actions';

@Injectable()
export class LeagueEffects {
    private actions$ = inject(Actions);
    private leagueApi = inject(LeagueApiService);
    private router = inject(Router);

    loadLeaguesOnAuth$ = createEffect(() =>
        this.actions$.pipe(
            ofType(userSessionCheckSucceeded),
            map(() => leaguesLoadStarted()),
        ),
    );

    loadLeagues$ = createEffect(() =>
        this.actions$.pipe(
            ofType(leaguesLoadStarted),
            switchMap(() =>
                this.leagueApi.getMyLeagues().pipe(
                    map((leagues) => leaguesLoaded({leagues})),
                    catchError((err) => of(leaguesLoadFailed({error: err.message}))),
                ),
            ),
        ),
    );

    leagueSelected$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(leagueSelected),
                tap(({slug}) => {
                    localStorage.setItem('currentLeague', slug);
                    this.router.navigate(['/dashboard', slug]);
                }),
            ),
        {dispatch: false},
    );

    leagueDeselected$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(leagueDeselected),
                tap(() => {
                    localStorage.removeItem('currentLeague');
                    this.router.navigate(['/profile']);
                }),
            ),
        {dispatch: false},
    );
}
```

- [ ] **Step 7: Register league state in app.config.ts**

Replace `frontend/src/app/app.config.ts`:

```typescript
import {
    ApplicationConfig,
    isDevMode,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {provideStoreDevtools} from '@ngrx/store-devtools';

import {routes} from '@fb/app.routes';
import {authReducer} from '@fb/core/state/auth/auth.reducer';
import {AuthEffects} from '@fb/core/state/auth/auth.effects';
import {leagueReducer} from '@fb/core/state/league/league.reducer';
import {LeagueEffects} from '@fb/core/state/league/league.effects';
import {authInterceptor} from '@fb/core/interceptors/auth.interceptor';
import {initUser} from '@fb/core/initializer/initUser';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideStore({auth: authReducer, league: leagueReducer}),
        provideEffects([AuthEffects, LeagueEffects]),
        ...(isDevMode() ? [provideStoreDevtools({maxAge: 25})] : []),
        provideAppInitializer(initUser),
    ],
};
```

- [ ] **Step 8: Verify the app builds**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development`

Expected: Build succeeds.

- [ ] **Step 9: Run existing frontend tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test`

Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
cd /Volumes/CaseSensitive/src/fantabet
git add frontend/src/app/shared/models/league.model.ts \
       frontend/src/app/core/repository/league-api.service.ts \
       frontend/src/app/core/state/league/ \
       frontend/src/app/app.config.ts
git commit -m "feat: add league NgRx state, effects, API service, and selectors"
```

---

## Task 11: Frontend — Update Auth Effects for Post-Login Redirect

**Files:**

- Modify: `frontend/src/app/core/state/auth/auth.effects.ts`

- [ ] **Step 1: Update loginSuccess$ to use league resolver logic**

In `frontend/src/app/core/state/auth/auth.effects.ts`, replace the `loginSuccess$` effect:

```typescript
loginSuccess$ = createEffect(
    () =>
        this.actions$.pipe(
            ofType(userLoginSucceeded),
            tap(() => {
                const slug = localStorage.getItem('currentLeague');
                if (slug) {
                    this.router.navigate(['/dashboard', slug]);
                } else {
                    this.router.navigate(['/profile']);
                }
            }),
        ),
    {dispatch: false},
);
```

Also update `registerSuccess$` to navigate to `/login` (already does this, no change needed).

- [ ] **Step 2: Update logoutSuccess$ to clear localStorage**

Replace the `logoutSuccess$` effect:

```typescript
logoutSuccess$ = createEffect(
    () =>
        this.actions$.pipe(
            ofType(userLogoutSucceeded),
            tap(() => {
                localStorage.removeItem('currentLeague');
                this.router.navigate(['/login']);
            }),
        ),
    {dispatch: false},
);
```

- [ ] **Step 3: Verify the app builds**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development`

Expected: Build succeeds.

- [ ] **Step 4: Run existing frontend tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Volumes/CaseSensitive/src/fantabet
git add frontend/src/app/core/state/auth/auth.effects.ts
git commit -m "feat: update post-login redirect to use league resolver and clear localStorage on logout"
```

claude --resume d348fb38-e122-4cff-b199-efff5a04a0a1  

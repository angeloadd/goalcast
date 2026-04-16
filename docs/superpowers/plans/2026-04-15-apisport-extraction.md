# ApiSport Extraction & Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract remaining JSON mapping from `ApiSportSyncService` into the `apisport` package (enums + DTOs + mapper + service), fix N+1 queries, and add unit tests for mapper and service.

**Architecture:** One mapper class (`ApiSportMapper`) with all mapping methods, one service class (`ApiSportService`) with all fetch methods, split test files per domain. `ApiSportSyncService` receives DTOs and does entity persistence with batch operations. Scheduler orchestrates the flow.

**Tech Stack:** Kotlin 2.2.21, Spring Boot 4.0.3, Jackson 3 (`tools.jackson.databind`), JUnit 5, MockK, AssertJ

**Spec:** `docs/superpowers/specs/2026-04-15-apisport-extraction-design.md`

**Testing guide:** `docs/testing-guide.md`

**Existing patterns to follow:**
- Mapper test: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedTournamentApiSportMapperTest.kt`
- Service test: `src/test/kotlin/com/goalcast/apisport/service/SyncedTournamentApiSportServiceTest.kt`
- Base class: `BaseUnitTest` (MockK extension + unnecessary stub check)
- API reference JSON: `src/main/resources/apisport-reference/`

---

## Task 1: Enums + DTOs

**Files:**
- Create: `src/main/kotlin/com/goalcast/apisport/dto/GamePhase.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/GameStatus.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/SyncedTeam.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/SyncedPlayer.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/SyncedGame.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/SyncedGoal.kt`
- Create: `src/main/kotlin/com/goalcast/apisport/dto/SyncedTopScorer.kt`

- [ ] **Step 1: Create GamePhase enum**

Create `src/main/kotlin/com/goalcast/apisport/dto/GamePhase.kt`:

```kotlin
package com.goalcast.apisport.dto

enum class GamePhase(val dbValue: String) {
    GROUP("group"),
    ROUND_OF_32("round_of_32"),
    ROUND_OF_16("round_of_16"),
    QUARTER("quarter"),
    SEMI("semi"),
    FINAL("final");
}
```

- [ ] **Step 2: Create GameStatus enum**

Create `src/main/kotlin/com/goalcast/apisport/dto/GameStatus.kt`:

```kotlin
package com.goalcast.apisport.dto

enum class GameStatus(val dbValue: String) {
    NOT_STARTED("not_started"),
    ONGOING("ongoing"),
    FINISHED("finished");
}
```

- [ ] **Step 3: Create remaining DTOs**

Create `src/main/kotlin/com/goalcast/apisport/dto/SyncedTeam.kt`:

```kotlin
package com.goalcast.apisport.dto

data class SyncedTeam(
    val apiId: Int,
    val name: String,
    val code: String?,
    val logo: String?,
    val isNational: Boolean,
)
```

Create `src/main/kotlin/com/goalcast/apisport/dto/SyncedPlayer.kt`:

```kotlin
package com.goalcast.apisport.dto

data class SyncedPlayer(
    val apiId: Int,
    val displayedName: String,
)
```

Create `src/main/kotlin/com/goalcast/apisport/dto/SyncedGame.kt`:

```kotlin
package com.goalcast.apisport.dto

import java.time.Instant

data class SyncedGame(
    val apiId: Int,
    val stage: String,
    val phase: GamePhase,
    val status: GameStatus,
    val startedAt: Instant,
    val homeTeamApiId: Int,
    val awayTeamApiId: Int,
    val homeScore: Int?,
    val awayScore: Int?,
)
```

Create `src/main/kotlin/com/goalcast/apisport/dto/SyncedGoal.kt`:

```kotlin
package com.goalcast.apisport.dto

data class SyncedGoal(
    val playerApiId: Int,
    val scoringTeamApiId: Int,
    val isOwnGoal: Boolean,
    val scoredAt: Int,
)
```

Create `src/main/kotlin/com/goalcast/apisport/dto/SyncedTopScorer.kt`:

```kotlin
package com.goalcast.apisport.dto

data class SyncedTopScorer(
    val playerApiId: Int,
)
```

- [ ] **Step 4: Run tests to verify no regression**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass (new files are just data classes, no behavior).

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/dto/
git commit -m "feat: add enums and DTOs for ApiSport extraction"
```

---

## Task 2: Team Mapper + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedTeamApiSportMapperTest.kt`

- [ ] **Step 1: Write the team mapper test**

Create `src/test/kotlin/com/goalcast/apisport/mapper/SyncedTeamApiSportMapperTest.kt`:

```kotlin
package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedTeamApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    private val validTeamsJson = """
        [
            {
                "team": {
                    "id": 1,
                    "name": "Belgium",
                    "code": "BEL",
                    "country": "Belgium",
                    "national": true,
                    "logo": "https://media.api-sports.io/football/teams/1.png"
                }
            },
            {
                "team": {
                    "id": 16,
                    "name": "Mexico",
                    "code": "MEX",
                    "country": "Mexico",
                    "national": true,
                    "logo": "https://media.api-sports.io/football/teams/16.png"
                }
            }
        ]
    """.trimIndent()

    @Test
    fun `maps valid teams response`() {
        val nodes = parse(validTeamsJson).toList()
        val result = mapper.mapToSyncedTeams(nodes)

        assertThat(result).hasSize(2)
        assertThat(result[0].apiId).isEqualTo(1)
        assertThat(result[0].name).isEqualTo("Belgium")
        assertThat(result[0].code).isEqualTo("BEL")
        assertThat(result[0].logo).isEqualTo("https://media.api-sports.io/football/teams/1.png")
        assertThat(result[0].isNational).isTrue()
    }

    @Test
    fun `maps empty response to empty list`() {
        val result = mapper.mapToSyncedTeams(emptyList())
        assertThat(result).isEmpty()
    }

    @Test
    fun `handles nullable code and logo`() {
        val json = """[{"team": {"id": 1, "name": "Test", "national": false}}]"""
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedTeams(nodes)

        assertThat(result[0].code).isNull()
        assertThat(result[0].logo).isNull()
        assertThat(result[0].isNational).isFalse()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedTeamApiSportMapperTest`

Expected: FAIL — `mapToSyncedTeams` doesn't exist.

- [ ] **Step 3: Add mapToSyncedTeams to ApiSportMapper**

Add to `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt` inside the class body:

```kotlin
fun mapToSyncedTeams(response: List<JsonNode>): List<SyncedTeam> {
    return response.map { node ->
        val t = node.path("team")
        SyncedTeam(
            apiId = t.path("id").asInt(),
            name = t.path("name").asString(),
            code = t.path("code").asString(null),
            logo = t.path("logo").asString(null),
            isNational = t.path("national").asBoolean(false),
        )
    }
}
```

Add import: `import com.goalcast.apisport.dto.SyncedTeam`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedTeamApiSportMapperTest`

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt \
       src/test/kotlin/com/goalcast/apisport/mapper/SyncedTeamApiSportMapperTest.kt
git commit -m "feat: add team mapping to ApiSportMapper with tests"
```

---

## Task 3: Player Mapper + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedPlayerApiSportMapperTest.kt`

- [ ] **Step 1: Write the player mapper test**

Create `src/test/kotlin/com/goalcast/apisport/mapper/SyncedPlayerApiSportMapperTest.kt`:

```kotlin
package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedPlayerApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    @Test
    fun `maps valid squad response`() {
        val json = """
            [
                {
                    "team": {"id": 1, "name": "Belgium"},
                    "players": [
                        {"id": 730, "name": "T. Courtois", "position": "Goalkeeper"},
                        {"id": 162511, "name": "S. Lammens", "position": "Goalkeeper"}
                    ]
                }
            ]
        """.trimIndent()
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedPlayers(nodes)

        assertThat(result).hasSize(2)
        assertThat(result[0].apiId).isEqualTo(730)
        assertThat(result[0].displayedName).isEqualTo("T. Courtois")
        assertThat(result[1].apiId).isEqualTo(162511)
    }

    @Test
    fun `returns empty list for empty response`() {
        val result = mapper.mapToSyncedPlayers(emptyList())
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns empty list for empty players array`() {
        val json = """[{"team": {"id": 1}, "players": []}]"""
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedPlayers(nodes)
        assertThat(result).isEmpty()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedPlayerApiSportMapperTest`

Expected: FAIL — `mapToSyncedPlayers` doesn't exist.

- [ ] **Step 3: Add mapToSyncedPlayers to ApiSportMapper**

```kotlin
fun mapToSyncedPlayers(response: List<JsonNode>): List<SyncedPlayer> {
    if (response.isEmpty()) return emptyList()
    return response[0].path("players").map { p ->
        SyncedPlayer(
            apiId = p.path("id").asInt(),
            displayedName = p.path("name").asString(),
        )
    }
}
```

Add import: `import com.goalcast.apisport.dto.SyncedPlayer`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedPlayerApiSportMapperTest`

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt \
       src/test/kotlin/com/goalcast/apisport/mapper/SyncedPlayerApiSportMapperTest.kt
git commit -m "feat: add player mapping to ApiSportMapper with tests"
```

---

## Task 4: Game Mapper + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedGameApiSportMapperTest.kt`

- [ ] **Step 1: Write the game mapper test**

Create `src/test/kotlin/com/goalcast/apisport/mapper/SyncedGameApiSportMapperTest.kt`:

```kotlin
package com.goalcast.apisport.mapper

import BaseUnitTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import tools.jackson.databind.ObjectMapper
import java.time.Instant

class SyncedGameApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    private fun fixtureJson(
        id: Int = 1489369,
        timestamp: Long = 1781204400,
        statusShort: String = "NS",
        round: String = "Group Stage - 1",
        homeId: Int = 16,
        awayId: Int = 1531,
        homeGoals: String = "null",
        awayGoals: String = "null",
    ) = """
        [{
            "fixture": {
                "id": $id,
                "timestamp": $timestamp,
                "status": {"short": "$statusShort"}
            },
            "league": {"round": "$round"},
            "teams": {
                "home": {"id": $homeId},
                "away": {"id": $awayId}
            },
            "goals": {"home": $homeGoals, "away": $awayGoals}
        }]
    """.trimIndent()

    @Test
    fun `maps valid fixture`() {
        val nodes = parse(fixtureJson()).toList()
        val result = mapper.mapToSyncedGames(nodes)

        assertThat(result).hasSize(1)
        assertThat(result[0].apiId).isEqualTo(1489369)
        assertThat(result[0].startedAt).isEqualTo(Instant.ofEpochSecond(1781204400))
        assertThat(result[0].stage).isEqualTo("Group Stage - 1")
        assertThat(result[0].phase).isEqualTo(GamePhase.GROUP)
        assertThat(result[0].status).isEqualTo(GameStatus.NOT_STARTED)
        assertThat(result[0].homeTeamApiId).isEqualTo(16)
        assertThat(result[0].awayTeamApiId).isEqualTo(1531)
        assertThat(result[0].homeScore).isNull()
        assertThat(result[0].awayScore).isNull()
    }

    @Test
    fun `maps scores when present`() {
        val nodes = parse(fixtureJson(homeGoals = "2", awayGoals = "1", statusShort = "FT")).toList()
        val result = mapper.mapToSyncedGames(nodes)

        assertThat(result[0].homeScore).isEqualTo(2)
        assertThat(result[0].awayScore).isEqualTo(1)
        assertThat(result[0].status).isEqualTo(GameStatus.FINISHED)
    }

    @Test
    fun `maps empty response to empty list`() {
        assertThat(mapper.mapToSyncedGames(emptyList())).isEmpty()
    }

    @ParameterizedTest
    @CsvSource(
        "Group Stage - 1, GROUP",
        "Group Stage - 3, GROUP",
        "Round of 32, ROUND_OF_32",
        "Round of 16, ROUND_OF_16",
        "Quarter-finals, QUARTER",
        "Semi-finals, SEMI",
        "Final, FINAL",
        "Unknown Round, GROUP",
    )
    fun `maps round to correct GamePhase`(round: String, expected: GamePhase) {
        val nodes = parse(fixtureJson(round = round)).toList()
        val result = mapper.mapToSyncedGames(nodes)
        assertThat(result[0].phase).isEqualTo(expected)
    }

    @ParameterizedTest
    @CsvSource(
        "FT, FINISHED", "AET, FINISHED", "PEN, FINISHED",
        "1H, ONGOING", "HT, ONGOING", "2H, ONGOING", "ET, ONGOING", "LIVE, ONGOING",
        "NS, NOT_STARTED", "TBD, NOT_STARTED", "PST, NOT_STARTED",
    )
    fun `maps status short to correct GameStatus`(statusShort: String, expected: GameStatus) {
        val nodes = parse(fixtureJson(statusShort = statusShort)).toList()
        val result = mapper.mapToSyncedGames(nodes)
        assertThat(result[0].status).isEqualTo(expected)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedGameApiSportMapperTest`

Expected: FAIL — `mapToSyncedGames` doesn't exist.

- [ ] **Step 3: Add mapToSyncedGames and private helpers to ApiSportMapper**

Add these private methods and the public mapping method to `ApiSportMapper`:

```kotlin
fun mapToSyncedGames(response: List<JsonNode>): List<SyncedGame> {
    return response.map { node ->
        val fixture = node.path("fixture")
        val round = node.path("league").path("round").asString()
        SyncedGame(
            apiId = fixture.path("id").asInt(),
            stage = round,
            phase = mapRoundToPhase(round),
            status = mapApiStatus(fixture.path("status").path("short").asString()),
            startedAt = Instant.ofEpochSecond(fixture.path("timestamp").asLong()),
            homeTeamApiId = node.path("teams").path("home").path("id").asInt(),
            awayTeamApiId = node.path("teams").path("away").path("id").asInt(),
            homeScore = node.path("goals").path("home").let { if (it.isNull) null else it.asInt() },
            awayScore = node.path("goals").path("away").let { if (it.isNull) null else it.asInt() },
        )
    }
}

private fun mapRoundToPhase(round: String): GamePhase {
    val lower = round.lowercase()
    return when {
        lower.contains("group") -> GamePhase.GROUP
        lower.contains("32") -> GamePhase.ROUND_OF_32
        lower.contains("16") -> GamePhase.ROUND_OF_16
        lower.contains("quarter") -> GamePhase.QUARTER
        lower.contains("semi") -> GamePhase.SEMI
        lower.contains("final") && !lower.contains("semi") -> GamePhase.FINAL
        else -> GamePhase.GROUP
    }
}

private fun mapApiStatus(short: String): GameStatus = when (short) {
    "FT", "AET", "PEN" -> GameStatus.FINISHED
    "1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE" -> GameStatus.ONGOING
    else -> GameStatus.NOT_STARTED
}
```

Add imports:

```kotlin
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import java.time.Instant
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedGameApiSportMapperTest`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt \
       src/test/kotlin/com/goalcast/apisport/mapper/SyncedGameApiSportMapperTest.kt
git commit -m "feat: add game mapping with phase/status enums to ApiSportMapper with tests"
```

---

## Task 5: Goal Mapper + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedGoalApiSportMapperTest.kt`

- [ ] **Step 1: Write the goal mapper test**

Create `src/test/kotlin/com/goalcast/apisport/mapper/SyncedGoalApiSportMapperTest.kt`:

```kotlin
package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedGoalApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    private fun goalJson(
        elapsed: Int = 25,
        extra: String = "null",
        playerId: Int = 6126,
        teamId: Int = 463,
        detail: String = "Normal Goal",
        comments: String = "null",
    ) = """
        [{
            "time": {"elapsed": $elapsed, "extra": $extra},
            "player": {"id": $playerId},
            "team": {"id": $teamId},
            "detail": "$detail",
            "comments": $comments
        }]
    """.trimIndent()

    @Test
    fun `maps normal goal`() {
        val nodes = parse(goalJson()).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result).hasSize(1)
        assertThat(result[0].playerApiId).isEqualTo(6126)
        assertThat(result[0].scoringTeamApiId).isEqualTo(463)
        assertThat(result[0].isOwnGoal).isFalse()
        assertThat(result[0].scoredAt).isEqualTo(25)
    }

    @Test
    fun `maps own goal`() {
        val nodes = parse(goalJson(detail = "Own Goal")).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result).hasSize(1)
        assertThat(result[0].isOwnGoal).isTrue()
    }

    @Test
    fun `computes scoredAt with extra time`() {
        val nodes = parse(goalJson(elapsed = 90, extra = "3")).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result[0].scoredAt).isEqualTo(93)
    }

    @Test
    fun `filters missed penalty`() {
        val nodes = parse(goalJson(detail = "Missed Penalty")).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result).isEmpty()
    }

    @Test
    fun `filters penalty shootout goal`() {
        val nodes = parse(goalJson(elapsed = 120, extra = "1", comments = "\"Penalty Shootout\"")).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result).isEmpty()
    }

    @Test
    fun `does not filter regular penalty in extra time`() {
        val nodes = parse(goalJson(elapsed = 105, extra = "3", detail = "Penalty")).toList()
        val result = mapper.mapToSyncedGoals(nodes)

        assertThat(result).hasSize(1)
    }

    @Test
    fun `maps empty response to empty list`() {
        assertThat(mapper.mapToSyncedGoals(emptyList())).isEmpty()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedGoalApiSportMapperTest`

Expected: FAIL — `mapToSyncedGoals` doesn't exist.

- [ ] **Step 3: Add mapToSyncedGoals to ApiSportMapper**

```kotlin
fun mapToSyncedGoals(response: List<JsonNode>): List<SyncedGoal> {
    return response.mapNotNull { node ->
        val detail = node.path("detail").asString()
        if (detail.contains("Missed")) return@mapNotNull null

        val time = node.path("time")
        val elapsed = time.path("elapsed").asInt()
        val extra = if (time.path("extra").isNull) 0 else time.path("extra").asInt()
        val comment = node.path("comments").let { if (it.isNull) "" else it.asString() }

        if (elapsed == 120 && extra > 0 && comment.contains("Penalty", ignoreCase = true)) {
            return@mapNotNull null
        }

        SyncedGoal(
            playerApiId = node.path("player").path("id").asInt(),
            scoringTeamApiId = node.path("team").path("id").asInt(),
            isOwnGoal = detail.contains("Own", ignoreCase = true),
            scoredAt = elapsed + extra,
        )
    }
}
```

Add import: `import com.goalcast.apisport.dto.SyncedGoal`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedGoalApiSportMapperTest`

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt \
       src/test/kotlin/com/goalcast/apisport/mapper/SyncedGoalApiSportMapperTest.kt
git commit -m "feat: add goal mapping with filters to ApiSportMapper with tests"
```

---

## Task 6: Top Scorer Mapper + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/mapper/SyncedTopScorerApiSportMapperTest.kt`

- [ ] **Step 1: Write the top scorer mapper test**

Create `src/test/kotlin/com/goalcast/apisport/mapper/SyncedTopScorerApiSportMapperTest.kt`:

```kotlin
package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedTopScorerApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    @Test
    fun `maps players tied at top score`() {
        val json = """
            [
                {"player": {"id": 100}, "statistics": [{"goals": {"total": 5}}]},
                {"player": {"id": 200}, "statistics": [{"goals": {"total": 5}}]},
                {"player": {"id": 300}, "statistics": [{"goals": {"total": 3}}]}
            ]
        """.trimIndent()
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedTopScorers(nodes)

        assertThat(result).hasSize(2)
        assertThat(result[0].playerApiId).isEqualTo(100)
        assertThat(result[1].playerApiId).isEqualTo(200)
    }

    @Test
    fun `returns single player when no tie`() {
        val json = """
            [
                {"player": {"id": 100}, "statistics": [{"goals": {"total": 5}}]},
                {"player": {"id": 200}, "statistics": [{"goals": {"total": 3}}]}
            ]
        """.trimIndent()
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedTopScorers(nodes)

        assertThat(result).hasSize(1)
        assertThat(result[0].playerApiId).isEqualTo(100)
    }

    @Test
    fun `returns empty list for empty response`() {
        assertThat(mapper.mapToSyncedTopScorers(emptyList())).isEmpty()
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedTopScorerApiSportMapperTest`

Expected: FAIL — `mapToSyncedTopScorers` doesn't exist.

- [ ] **Step 3: Add mapToSyncedTopScorers to ApiSportMapper**

```kotlin
fun mapToSyncedTopScorers(response: List<JsonNode>): List<SyncedTopScorer> {
    if (response.isEmpty()) return emptyList()
    val topGoals = response[0].path("statistics")[0].path("goals").path("total").asInt()
    return response.takeWhile {
        it.path("statistics")[0].path("goals").path("total").asInt() >= topGoals
    }.map {
        SyncedTopScorer(playerApiId = it.path("player").path("id").asInt())
    }
}
```

Add import: `import com.goalcast.apisport.dto.SyncedTopScorer`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest=SyncedTopScorerApiSportMapperTest`

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/mapper/ApiSportMapper.kt \
       src/test/kotlin/com/goalcast/apisport/mapper/SyncedTopScorerApiSportMapperTest.kt
git commit -m "feat: add top scorer mapping to ApiSportMapper with tests"
```

---

## Task 7: ApiSportService — Remaining Methods + Tests

**Files:**
- Modify: `src/main/kotlin/com/goalcast/apisport/service/ApiSportService.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/service/SyncedTeamApiSportServiceTest.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/service/SyncedPlayerApiSportServiceTest.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/service/SyncedGameApiSportServiceTest.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/service/SyncedGoalApiSportServiceTest.kt`
- Create: `src/test/kotlin/com/goalcast/apisport/service/SyncedTopScorerApiSportServiceTest.kt`

- [ ] **Step 1: Add all service methods**

Update `src/main/kotlin/com/goalcast/apisport/service/ApiSportService.kt`:

```kotlin
package com.goalcast.apisport.service

import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.*
import com.goalcast.apisport.exception.TournamentNotFoundException
import com.goalcast.apisport.mapper.ApiSportMapper
import org.springframework.stereotype.Service

@Service
class ApiSportService(private val apiSportClient: ApiSportClient, private val mapper: ApiSportMapper) {

    fun getTournament(id: Int, season: Int): SyncedTournament {
        val results = apiSportClient.get(
            "leagues",
            mapOf("id" to id.toString(), "season" to season.toString())
        ).ifEmpty { throw TournamentNotFoundException(id, season) }

        return mapper.mapToSyncedTournament(results[0], id, season)
    }

    fun getTeams(leagueId: Int, season: Int): List<SyncedTeam> {
        val results = apiSportClient.get(
            "teams",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedTeams(results)
    }

    fun getPlayers(teamApiId: Int): List<SyncedPlayer> {
        val results = apiSportClient.get(
            "players/squads",
            mapOf("team" to teamApiId.toString())
        )
        return mapper.mapToSyncedPlayers(results)
    }

    fun getGames(leagueId: Int, season: Int): List<SyncedGame> {
        val results = apiSportClient.get(
            "fixtures",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedGames(results)
    }

    fun getGoals(fixtureId: Int): List<SyncedGoal> {
        val results = apiSportClient.get(
            "fixtures/events",
            mapOf("fixture" to fixtureId.toString(), "type" to "Goal")
        )
        return mapper.mapToSyncedGoals(results)
    }

    fun getTopScorers(leagueId: Int, season: Int): List<SyncedTopScorer> {
        val results = apiSportClient.get(
            "players/topscorers",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedTopScorers(results)
    }
}
```

- [ ] **Step 2: Write all service tests**

Each follows the same pattern as `SyncedTournamentApiSportServiceTest`: mock client + mapper, verify correct params, assert return value.

Create `src/test/kotlin/com/goalcast/apisport/service/SyncedTeamApiSportServiceTest.kt`:

```kotlin
package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode

class SyncedTeamApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs lateinit var apiSportService: ApiSportService
    @MockK lateinit var apiSportClient: ApiSportClient
    @MockK lateinit var mapper: ApiSportMapper

    @Test
    fun `getTeams calls client and mapper with correct params`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedTeam(1, "Belgium", "BEL", null, true))
        every { apiSportClient.get("teams", mapOf("league" to "1", "season" to "2026")) } returns listOf(node)
        every { mapper.mapToSyncedTeams(listOf(node)) } returns expected

        val result = apiSportService.getTeams(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedTeams(listOf(node)) }
    }

    @Test
    fun `getTeams returns empty list when api returns empty`() {
        every { apiSportClient.get("teams", any()) } returns emptyList()
        every { mapper.mapToSyncedTeams(emptyList()) } returns emptyList()

        assertThat(apiSportService.getTeams(1, 2026)).isEmpty()
    }
}
```

Create `src/test/kotlin/com/goalcast/apisport/service/SyncedPlayerApiSportServiceTest.kt`:

```kotlin
package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode

class SyncedPlayerApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs lateinit var apiSportService: ApiSportService
    @MockK lateinit var apiSportClient: ApiSportClient
    @MockK lateinit var mapper: ApiSportMapper

    @Test
    fun `getPlayers calls client with team id`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedPlayer(730, "T. Courtois"))
        every { apiSportClient.get("players/squads", mapOf("team" to "1")) } returns listOf(node)
        every { mapper.mapToSyncedPlayers(listOf(node)) } returns expected

        val result = apiSportService.getPlayers(1)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedPlayers(listOf(node)) }
    }

    @Test
    fun `getPlayers returns empty list when api returns empty`() {
        every { apiSportClient.get("players/squads", any()) } returns emptyList()
        every { mapper.mapToSyncedPlayers(emptyList()) } returns emptyList()

        assertThat(apiSportService.getPlayers(1)).isEmpty()
    }
}
```

Create `src/test/kotlin/com/goalcast/apisport/service/SyncedGameApiSportServiceTest.kt`:

```kotlin
package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode
import java.time.Instant

class SyncedGameApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs lateinit var apiSportService: ApiSportService
    @MockK lateinit var apiSportClient: ApiSportClient
    @MockK lateinit var mapper: ApiSportMapper

    @Test
    fun `getGames calls client and mapper with correct params`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedGame(1, "Group Stage - 1", GamePhase.GROUP, GameStatus.NOT_STARTED, Instant.EPOCH, 16, 1531, null, null))
        every { apiSportClient.get("fixtures", mapOf("league" to "1", "season" to "2026")) } returns listOf(node)
        every { mapper.mapToSyncedGames(listOf(node)) } returns expected

        val result = apiSportService.getGames(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedGames(listOf(node)) }
    }
}
```

Create `src/test/kotlin/com/goalcast/apisport/service/SyncedGoalApiSportServiceTest.kt`:

```kotlin
package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedGoal
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode

class SyncedGoalApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs lateinit var apiSportService: ApiSportService
    @MockK lateinit var apiSportClient: ApiSportClient
    @MockK lateinit var mapper: ApiSportMapper

    @Test
    fun `getGoals calls client with fixture id and type Goal`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedGoal(6126, 463, false, 25))
        every { apiSportClient.get("fixtures/events", mapOf("fixture" to "999", "type" to "Goal")) } returns listOf(node)
        every { mapper.mapToSyncedGoals(listOf(node)) } returns expected

        val result = apiSportService.getGoals(999)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { apiSportClient.get("fixtures/events", mapOf("fixture" to "999", "type" to "Goal")) }
    }
}
```

Create `src/test/kotlin/com/goalcast/apisport/service/SyncedTopScorerApiSportServiceTest.kt`:

```kotlin
package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedTopScorer
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.JsonNode

class SyncedTopScorerApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs lateinit var apiSportService: ApiSportService
    @MockK lateinit var apiSportClient: ApiSportClient
    @MockK lateinit var mapper: ApiSportMapper

    @Test
    fun `getTopScorers calls client and mapper with correct params`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedTopScorer(100))
        every { apiSportClient.get("players/topscorers", mapOf("league" to "1", "season" to "2026")) } returns listOf(node)
        every { mapper.mapToSyncedTopScorers(listOf(node)) } returns expected

        val result = apiSportService.getTopScorers(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedTopScorers(listOf(node)) }
    }
}
```

- [ ] **Step 3: Run all service tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test -Dtest="SyncedTeamApiSportServiceTest,SyncedPlayerApiSportServiceTest,SyncedGameApiSportServiceTest,SyncedGoalApiSportServiceTest,SyncedTopScorerApiSportServiceTest"`

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/apisport/service/ApiSportService.kt \
       src/test/kotlin/com/goalcast/apisport/service/
git commit -m "feat: add team, player, game, goal, top scorer methods to ApiSportService with tests"
```

---

## Task 8: Refactor ApiSportSyncService — Accept DTOs + Fix N+1

**Files:**
- Modify: `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`
- Modify: `src/main/kotlin/com/goalcast/repository/GameRepository.kt`

This is the largest task. The sync service stops calling `ApiSportClient` directly and instead receives DTOs. All N+1 fixes applied.

- [ ] **Step 1: Add targeted query methods to GameRepository**

Update `src/main/kotlin/com/goalcast/repository/GameRepository.kt`:

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
    fun findByStatus(status: String): List<Game>
    fun findFirstByTournamentIdOrderByStartedAtAsc(tournamentId: Long): Game?
    fun findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournamentId: Long, phase: String): Game?
}
```

- [ ] **Step 2: Rewrite ApiSportSyncService**

Replace `src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt`:

```kotlin
package com.goalcast.service

import com.goalcast.apisport.dto.*
import com.goalcast.apisport.service.ApiSportService
import com.goalcast.entity.*
import com.goalcast.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

@Service
class ApiSportSyncService(
    private val apiSportService: ApiSportService,
    private val clock: Clock,
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

    companion object {
        const val LEAGUE_ID = 1
        const val SEASON = 2026
    }

    @Transactional
    fun syncTournament(synced: SyncedTournament): Tournament {
        val tournament = tournamentRepository.findByApiId(synced.apiId)
            ?: Tournament(apiId = synced.apiId, name = synced.name, season = synced.season, country = synced.country)

        tournament.apply {
            name = synced.name
            country = synced.country
            logo = synced.logo
            isCup = synced.isCup
            updatedAt = clock.instant()
        }
        tournamentRepository.save(tournament)
        log.info("Tournament[name={},apiId={},season={}]: synced", synced.name, synced.apiId, synced.season)
        return tournament
    }

    fun getTournament(): Tournament {
        return requireNotNull(tournamentRepository.findByApiId(LEAGUE_ID)) {
            "Tournament not synced yet. Run syncTournament() first."
        }
    }

    fun getTeamApiIdsForTournament(): List<Int> {
        val tournament = getTournament()
        return teamTournamentRepository.findByTournamentId(tournament.id).map { it.team.apiId }
    }

    @Transactional
    fun syncTeams(teams: List<SyncedTeam>) {
        val tournament = getTournament()
        val existingTeams = teamRepository.findAll().associateBy { it.apiId }
        val existingTT = teamTournamentRepository.findByTournamentId(tournament.id).associateBy { it.team.apiId }

        val teamsToSave = mutableListOf<Team>()
        val ttToSave = mutableListOf<TeamTournament>()

        for (synced in teams) {
            val team = existingTeams[synced.apiId]
                ?: Team(apiId = synced.apiId, name = synced.name)
            team.name = synced.name
            team.code = synced.code
            team.logo = synced.logo
            team.isNational = synced.isNational
            team.updatedAt = clock.instant()
            teamsToSave.add(team)

            if (synced.apiId !in existingTT) {
                ttToSave.add(TeamTournament(team = team, tournament = tournament))
            }
        }

        teamRepository.saveAll(teamsToSave)
        teamTournamentRepository.saveAll(ttToSave)
        log.info("Synced {} teams", teams.size)
    }

    @Transactional
    fun syncPlayers(teamApiId: Int, players: List<SyncedPlayer>) {
        val tournament = getTournament()
        val team = teamRepository.findByApiId(teamApiId) ?: return
        val existingPlayers = playerRepository.findAll().associateBy { it.apiId }
        val existingPT = playerTournamentRepository.findByTournamentId(tournament.id).associateBy { it.player.apiId }

        val playersToSave = mutableListOf<Player>()
        val ptToSave = mutableListOf<PlayerTournament>()

        for (synced in players) {
            val player = existingPlayers[synced.apiId]
                ?: Player(apiId = synced.apiId, displayedName = synced.displayedName)
            player.displayedName = synced.displayedName
            player.national = team
            player.updatedAt = clock.instant()
            playersToSave.add(player)

            if (synced.apiId !in existingPT) {
                ptToSave.add(PlayerTournament(player = player, tournament = tournament))
            }
        }

        playerRepository.saveAll(playersToSave)
        playerTournamentRepository.saveAll(ptToSave)
        log.info("Synced {} players for team apiId={}", players.size, teamApiId)
    }

    @Transactional
    fun syncGames(games: List<SyncedGame>) {
        val tournament = getTournament()
        val existingGames = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id).associateBy { it.apiId }
        val existingTeams = teamRepository.findAll().associateBy { it.apiId }
        val existingGameTeams = gameTeamRepository.findAll().groupBy { it.game.id }

        val gamesToSave = mutableListOf<Game>()
        val gameTeamsToSave = mutableListOf<GameTeam>()
        var hasNewGames = false

        for (synced in games) {
            val isNew = synced.apiId !in existingGames
            if (isNew) hasNewGames = true

            val game = existingGames[synced.apiId]
                ?: Game(apiId = synced.apiId, tournament = tournament, stage = synced.stage, phase = synced.phase.dbValue, startedAt = synced.startedAt)
            game.stage = synced.stage
            game.phase = synced.phase.dbValue
            game.status = synced.status.dbValue
            game.startedAt = synced.startedAt
            game.updatedAt = clock.instant()
            gamesToSave.add(game)
        }

        gameRepository.saveAll(gamesToSave)

        // Second pass for game teams (needs game IDs from save)
        for (synced in games) {
            val game = gamesToSave.find { it.apiId == synced.apiId } ?: continue
            val existingGT = existingGameTeams[game.id] ?: emptyList()
            val homeTeam = existingTeams[synced.homeTeamApiId] ?: continue
            val awayTeam = existingTeams[synced.awayTeamApiId] ?: continue

            val existingHome = existingGT.find { it.team.id == homeTeam.id }
            val existingAway = existingGT.find { it.team.id == awayTeam.id }

            if (existingHome != null) {
                existingHome.score = synced.homeScore
                gameTeamsToSave.add(existingHome)
            } else {
                gameTeamsToSave.add(GameTeam(game = game, team = homeTeam, isAway = false, score = synced.homeScore))
            }

            if (existingAway != null) {
                existingAway.score = synced.awayScore
                gameTeamsToSave.add(existingAway)
            } else {
                gameTeamsToSave.add(GameTeam(game = game, team = awayTeam, isAway = true, score = synced.awayScore))
            }
        }

        gameTeamRepository.saveAll(gameTeamsToSave)
        log.info("Synced {} games", games.size)

        if (hasNewGames) updateTournamentDates(tournament)
    }

    @Transactional
    fun syncGoals(gameApiId: Int, goals: List<SyncedGoal>) {
        val game = gameRepository.findByApiId(gameApiId) ?: return
        gameGoalRepository.deleteByGameId(game.id)

        val gameTeams = gameTeamRepository.findByGameId(game.id)
        val homeTeam = gameTeams.find { !it.isAway }?.team
        val awayTeam = gameTeams.find { it.isAway }?.team
        val allPlayers = playerRepository.findAll().associateBy { it.apiId }

        val goalsToSave = goals.mapNotNull { synced ->
            val player = allPlayers[synced.playerApiId] ?: return@mapNotNull null
            val creditedTeam = if (synced.isOwnGoal) {
                if (synced.scoringTeamApiId == homeTeam?.apiId) awayTeam else homeTeam
            } else {
                if (synced.scoringTeamApiId == homeTeam?.apiId) homeTeam else awayTeam
            }
            creditedTeam?.let {
                GameGoal(game = game, player = player, team = it, isOwnGoal = synced.isOwnGoal, scoredAt = synced.scoredAt)
            }
        }

        gameGoalRepository.saveAll(goalsToSave)
        log.info("Synced {} goals for game apiId={}", goalsToSave.size, gameApiId)
    }

    @Transactional
    fun syncTopScorers(topScorers: List<SyncedTopScorer>) {
        val tournament = getTournament()
        for (synced in topScorers) {
            val player = playerRepository.findByApiId(synced.playerApiId) ?: continue
            val pt = playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) ?: continue
            pt.isTopScorer = true
            playerTournamentRepository.save(pt)
        }
        log.info("Synced {} top scorers", topScorers.size)
    }

    @Transactional
    fun syncGameStatuses(): List<Game> {
        val now = clock.instant()
        val shouldHaveStarted = gameRepository.findByStatusAndStartedAtBefore("not_started", now)
        val ongoing = gameRepository.findByStatus("ongoing")
        val gamesToCheck = shouldHaveStarted + ongoing

        if (gamesToCheck.isEmpty()) {
            log.info("No games need status update")
            return emptyList()
        }

        log.info("Checking status for {} games", gamesToCheck.size)

        val allGames = apiSportService.getGames(LEAGUE_ID, SEASON)
        val apiIdToGame = allGames.associateBy { it.apiId }

        val newlyFinished = mutableListOf<Game>()

        for (game in gamesToCheck) {
            val apiId = game.apiId ?: continue
            val synced = apiIdToGame[apiId] ?: continue
            val newStatus = synced.status.dbValue

            if (game.status != newStatus) {
                val oldStatus = game.status
                game.status = newStatus
                game.updatedAt = clock.instant()
                gameRepository.save(game)
                log.info("Game {} (apiId={}) status: {} → {}", game.id, apiId, oldStatus, newStatus)

                val gameTeams = gameTeamRepository.findByGameId(game.id)
                val home = gameTeams.find { !it.isAway }
                val away = gameTeams.find { it.isAway }
                if (home != null && synced.homeScore != null) { home.score = synced.homeScore; gameTeamRepository.save(home) }
                if (away != null && synced.awayScore != null) { away.score = synced.awayScore; gameTeamRepository.save(away) }

                if (newStatus == "finished") newlyFinished.add(game)
            }
        }

        return newlyFinished
    }

    @Transactional
    fun syncMissingGoals() {
        val cutoff = clock.instant().minusSeconds(24 * 3600)
        val tournament = getTournament()
        val finishedGames = gameRepository.findByStatusAndTournamentId("finished", tournament.id)
            .filter { it.updatedAt.isAfter(cutoff) }

        for (game in finishedGames) {
            val gameTeams = gameTeamRepository.findByGameId(game.id)
            val homeScore = gameTeams.find { !it.isAway }?.score ?: 0
            val awayScore = gameTeams.find { it.isAway }?.score ?: 0
            val expectedGoals = homeScore + awayScore
            val actualGoals = gameGoalRepository.countByGameId(game.id)

            if (actualGoals.toInt() != expectedGoals) {
                val apiId = game.apiId ?: continue
                log.info("Game {} (apiId={}) has {}/{} goals, re-syncing", game.id, apiId, actualGoals, expectedGoals)
                val goals = apiSportService.getGoals(apiId)
                syncGoals(apiId, goals)
            }
        }
    }

    @Transactional
    fun syncWinner() {
        val tournament = getTournament()
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

    private fun updateTournamentDates(tournament: Tournament) {
        val firstGame = gameRepository.findFirstByTournamentIdOrderByStartedAtAsc(tournament.id)
        val finalGame = gameRepository.findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournament.id, "final")
        if (firstGame != null) tournament.startedAt = firstGame.startedAt
        if (finalGame != null) tournament.finalStartedAt = finalGame.startedAt
        tournament.updatedAt = clock.instant()
        tournamentRepository.save(tournament)
    }
}
```

- [ ] **Step 3: Run all tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass. The sync service compiles, existing integration tests still work.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/service/ApiSportSyncService.kt \
       src/main/kotlin/com/goalcast/repository/GameRepository.kt
git commit -m "refactor: ApiSportSyncService accepts DTOs, fix N+1 queries with batch operations"
```

---

## Task 9: Refactor ApiSportScheduler

**Files:**
- Modify: `src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt`

- [ ] **Step 1: Update scheduler to orchestrate service → sync flow**

Replace `src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt`:

```kotlin
package com.goalcast.scheduler

import com.goalcast.apisport.service.ApiSportService
import com.goalcast.service.ApiSportSyncService
import com.goalcast.service.ApiSportSyncService.Companion.LEAGUE_ID
import com.goalcast.service.ApiSportSyncService.Companion.SEASON
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class ApiSportScheduler(
    private val apiSportService: ApiSportService,
    private val syncService: ApiSportSyncService,
) {
    private val log = LoggerFactory.getLogger(ApiSportScheduler::class.java)

    // Daily at 06:00 UTC (08:00 Berlin) — sync tournament metadata
    @Scheduled(cron = "0 0 6 * * *")
    fun syncTournament() {
        runSync("tournament") {
            val synced = apiSportService.getTournament(LEAGUE_ID, SEASON)
            syncService.syncTournament(synced)
        }
    }

    // Daily at 07:00 UTC (09:00 Berlin) — sync teams
    @Scheduled(cron = "0 0 7 * * *")
    fun syncTeams() {
        runSync("teams") {
            val teams = apiSportService.getTeams(LEAGUE_ID, SEASON)
            syncService.syncTeams(teams)
        }
    }

    // Daily at 08:00 UTC (10:00 Berlin) — sync players (slow due to rate limiting)
    @Scheduled(cron = "0 0 8 * * *")
    fun syncPlayers() {
        runSync("players") {
            val teamApiIds = syncService.getTeamApiIdsForTournament()
            for (teamApiId in teamApiIds) {
                val players = apiSportService.getPlayers(teamApiId)
                syncService.syncPlayers(teamApiId, players)
            }
        }
    }

    // Daily at 09:00 UTC (11:00 Berlin) — sync game schedule
    @Scheduled(cron = "0 0 9 * * *")
    fun syncGames() {
        runSync("games") {
            val games = apiSportService.getGames(LEAGUE_ID, SEASON)
            syncService.syncGames(games)
        }
    }

    // Every 5 minutes between 15:00 and 05:59 UTC (17:00–07:59 Berlin, match window)
    @Scheduled(cron = "0 */5 15-23,0-5 * * *")
    fun liveSync() {
        runSync("live") {
            val newlyFinished = syncService.syncGameStatuses()
            if (newlyFinished.isNotEmpty()) {
                log.info("{} games just finished, checking goals", newlyFinished.size)
            }
            syncService.syncMissingGoals()
        }
    }

    private fun runSync(name: String, block: () -> Unit) {
        try {
            log.info("Starting {} sync", name)
            block()
            log.info("Completed {} sync", name)
        } catch (e: Exception) {
            log.error("Failed {} sync: {}", name, e.message, e)
        }
    }
}
```

- [ ] **Step 2: Run all tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/main/kotlin/com/goalcast/scheduler/ApiSportScheduler.kt
git commit -m "refactor: scheduler orchestrates ApiSportService → SyncService flow with error handling"
```

---

## Task 10: Update SyncController + Clean Up

**Files:**
- Modify: `src/main/kotlin/com/goalcast/controller/SyncController.kt`
- Delete: `src/test/kotlin/com/goalcast/apisport/mapper/JsonNodeBehaviorTest.kt` (exploratory test, no longer needed)

- [ ] **Step 1: Update SyncController to use new flow**

Replace `src/main/kotlin/com/goalcast/controller/SyncController.kt`:

```kotlin
package com.goalcast.controller

import com.goalcast.apisport.service.ApiSportService
import com.goalcast.service.ApiSportSyncService
import com.goalcast.service.ApiSportSyncService.Companion.LEAGUE_ID
import com.goalcast.service.ApiSportSyncService.Companion.SEASON
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/**
 * Temporary controller for manually testing ApiSport sync.
 * TODO: replace with owner-only controller later.
 */
@RestController
@RequestMapping("/api/sync")
class SyncController(
    private val apiSportService: ApiSportService,
    private val syncService: ApiSportSyncService,
) {
    @PostMapping("/tournament")
    @ResponseStatus(HttpStatus.OK)
    fun syncTournament() = mapOf("result" to syncService.syncTournament(apiSportService.getTournament(LEAGUE_ID, SEASON)).name)

    @PostMapping("/teams")
    @ResponseStatus(HttpStatus.OK)
    fun syncTeams(): Map<String, String> {
        syncService.syncTeams(apiSportService.getTeams(LEAGUE_ID, SEASON))
        return mapOf("result" to "ok")
    }

    @PostMapping("/players")
    @ResponseStatus(HttpStatus.OK)
    fun syncPlayers(): Map<String, String> {
        val teamApiIds = syncService.getTeamApiIdsForTournament()
        for (teamApiId in teamApiIds) {
            syncService.syncPlayers(teamApiId, apiSportService.getPlayers(teamApiId))
        }
        return mapOf("result" to "ok")
    }

    @PostMapping("/games")
    @ResponseStatus(HttpStatus.OK)
    fun syncGames(): Map<String, String> {
        syncService.syncGames(apiSportService.getGames(LEAGUE_ID, SEASON))
        return mapOf("result" to "ok")
    }

    @PostMapping("/statuses")
    @ResponseStatus(HttpStatus.OK)
    fun syncStatuses(): Map<String, Any> {
        val finished = syncService.syncGameStatuses()
        return mapOf("newlyFinished" to finished.size)
    }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.OK)
    fun syncGoals(): Map<String, String> {
        syncService.syncMissingGoals()
        return mapOf("result" to "ok")
    }
}
```

- [ ] **Step 2: Delete exploratory test**

```bash
rm src/test/kotlin/com/goalcast/apisport/mapper/JsonNodeBehaviorTest.kt
```

- [ ] **Step 3: Run all tests**

Run: `cd /Volumes/CaseSensitive/src/fantabet && ./mvnw test`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main/kotlin/com/goalcast/controller/SyncController.kt
git add -u  # stages the deletion
git commit -m "refactor: update SyncController to use extracted services, remove exploratory test"
```

---

## Self-Review

**Spec coverage:**
- ✅ Enums: `GamePhase`, `GameStatus` with `dbValue` property
- ✅ DTOs: `SyncedTeam`, `SyncedPlayer`, `SyncedGame`, `SyncedGoal`, `SyncedTopScorer`
- ✅ Mapper: all 6 mapping methods (tournament exists + 5 new)
- ✅ Service: all 6 fetch methods (tournament exists + 5 new)
- ✅ N+1 fix #1: `syncTeams` pre-loads + batch save
- ✅ N+1 fix #2: `syncPlayers` pre-loads + batch save
- ✅ N+1 fix #3: `syncGames` pre-loads + batch save
- ✅ N+1 fix #6: `syncGoals` pre-loads players
- ✅ Fix #7: `updateTournamentDates` uses targeted queries
- ✅ Fix #8: `updateTournamentDates` only called on new games
- ✅ Fix #9: `syncGameStatuses` uses `apiSportService.getGames()` (returns DTOs)
- ✅ `syncMissingGoals` calls `apiSportService.getGoals()` then `syncGoals()`
- ✅ Scheduler: orchestrates with `runSync` error handling
- ✅ Tests: 5 mapper test files + 5 service test files (all in `apisport` package)
- ✅ `mapRoundToPhase` and `mapApiStatus` moved to mapper as private methods
- ✅ `ApiSportClient` dependency removed from `ApiSportSyncService`
- ✅ `Clock` injected for testability

**Type consistency:** `GamePhase.dbValue`/`GameStatus.dbValue` used consistently in sync service. Mapper returns enum types. Service passes through from mapper. All DTO field names match across tasks.
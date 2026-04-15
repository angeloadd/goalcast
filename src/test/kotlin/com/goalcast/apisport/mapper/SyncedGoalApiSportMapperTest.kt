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

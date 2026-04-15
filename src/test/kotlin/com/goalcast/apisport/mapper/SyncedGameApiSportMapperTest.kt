package com.goalcast.apisport.mapper

import BaseUnitTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.MethodSource
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

    @ParameterizedTest(name = "{0}")
    @MethodSource("winnerCases")
    @Suppress("UNUSED_PARAMETER")
    fun `mapWinnerTeamApiId returns correct winner`(description: String, homeWinner: String, awayWinner: String, expected: Int?) {
        val json = """{"teams": {"home": {"id": 26, "winner": $homeWinner}, "away": {"id": 2, "winner": $awayWinner}}}"""
        assertThat(mapper.mapWinnerTeamApiId(parse(json))).isEqualTo(expected)
    }

    companion object {
        @JvmStatic
        fun winnerCases(): java.util.stream.Stream<Arguments> = java.util.stream.Stream.of(
            Arguments.of("home wins", "true", "false", 26),
            Arguments.of("away wins", "false", "true", 2),
            Arguments.of("no winner", "null", "null", null),
        )
    }
}

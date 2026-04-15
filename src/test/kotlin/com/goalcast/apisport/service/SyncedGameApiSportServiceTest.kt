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
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

    @Test
    fun `getGames calls client and mapper with correct params`() {
        val node = mockk<JsonNode>()
        val expected = listOf(
            SyncedGame(
                1,
                "Group Stage - 1",
                GamePhase.GROUP,
                GameStatus.NOT_STARTED,
                Instant.EPOCH,
                16,
                1531,
                null,
                null
            )
        )
        every { apiSportClient.get("fixtures", mapOf("league" to "1", "season" to "2026")) } returns listOf(node)
        every { mapper.mapToSyncedGames(listOf(node)) } returns expected

        val result = apiSportService.getGames(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedGames(listOf(node)) }
    }

    @Test
    fun `getFixtureWinnerTeamApiId calls client with fixture id and returns winner`() {
        val node = mockk<JsonNode>()
        every { apiSportClient.get("fixtures", mapOf("id" to "979139")) } returns listOf(node)
        every { mapper.mapWinnerTeamApiId(node) } returns 26

        val result = apiSportService.getFixtureWinnerTeamApiId(979139)

        assertThat(result).isEqualTo(26)
        verify(exactly = 1) { mapper.mapWinnerTeamApiId(node) }
    }

    @Test
    fun `getFixtureWinnerTeamApiId returns null when api returns empty`() {
        every { apiSportClient.get("fixtures", mapOf("id" to "999")) } returns emptyList()

        assertThat(apiSportService.getFixtureWinnerTeamApiId(999)).isNull()
    }
}

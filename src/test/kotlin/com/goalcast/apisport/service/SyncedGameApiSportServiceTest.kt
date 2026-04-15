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

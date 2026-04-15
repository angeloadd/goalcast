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
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

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

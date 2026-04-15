package com.goalcast.apisport.service

import BaseUnitTest
import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.apisport.exception.TournamentNotFoundException
import com.goalcast.apisport.mapper.ApiSportMapper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import tools.jackson.databind.JsonNode

class SyncedTournamentApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

    @Test
    fun `getTournament maps first result and ignores the rest`() {
        val first = mockk<JsonNode>()
        val second = mockk<JsonNode>()
        val expected = SyncedTournament(
            apiId = 1, name = "World Cup", country = "World",
            logo = "https://logo.png", isCup = true, season = 2026,
        )
        every { apiSportClient.get("leagues", mapOf("id" to "1", "season" to "2026")) } returns listOf(first, second)
        every { mapper.mapToSyncedTournament(first, 1, 2026) } returns expected

        val result = apiSportService.getTournament(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedTournament(first, 1, 2026) }
        verify(exactly = 0) { mapper.mapToSyncedTournament(second, any(), any()) }
    }

    @Test
    fun `getTournament throws when api returns empty list`() {
        every { apiSportClient.get("leagues", mapOf("id" to "1", "season" to "2026")) } returns emptyList()

        assertThrows<TournamentNotFoundException> {
            apiSportService.getTournament(1, 2026)
        }
    }
}

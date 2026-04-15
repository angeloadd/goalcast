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
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

    @Test
    fun `getTopScorers calls client and mapper with correct params`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedTopScorer(100))
        every { apiSportClient.get("players/topscorers", mapOf("league" to "1", "season" to "2026")) } returns listOf(
            node
        )
        every { mapper.mapToSyncedTopScorers(listOf(node)) } returns expected

        val result = apiSportService.getTopScorers(1, 2026)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { mapper.mapToSyncedTopScorers(listOf(node)) }
    }
}

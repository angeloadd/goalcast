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
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

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

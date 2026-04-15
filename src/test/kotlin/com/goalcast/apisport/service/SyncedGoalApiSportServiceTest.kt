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
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper

    @Test
    fun `getGoals calls client with fixture id and type Goal`() {
        val node = mockk<JsonNode>()
        val expected = listOf(SyncedGoal(6126, 463, false, 25))
        every {
            apiSportClient.get(
                "fixtures/events",
                mapOf("fixture" to "999", "type" to "Goal")
            )
        } returns listOf(node)
        every { mapper.mapToSyncedGoals(listOf(node)) } returns expected

        val result = apiSportService.getGoals(999)

        assertThat(result).isEqualTo(expected)
        verify(exactly = 1) { apiSportClient.get("fixtures/events", mapOf("fixture" to "999", "type" to "Goal")) }
    }
}

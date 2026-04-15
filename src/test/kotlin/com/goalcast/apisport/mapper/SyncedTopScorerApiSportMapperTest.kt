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

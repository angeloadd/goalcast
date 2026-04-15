package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedPlayerApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    @Test
    fun `maps valid squad response`() {
        val json = """
            [
                {
                    "team": {"id": 1, "name": "Belgium"},
                    "players": [
                        {"id": 730, "name": "T. Courtois", "position": "Goalkeeper"},
                        {"id": 162511, "name": "S. Lammens", "position": "Goalkeeper"}
                    ]
                }
            ]
        """.trimIndent()
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedPlayers(nodes)

        assertThat(result).hasSize(2)
        assertThat(result[0].apiId).isEqualTo(730)
        assertThat(result[0].displayedName).isEqualTo("T. Courtois")
        assertThat(result[1].apiId).isEqualTo(162511)
    }

    @Test
    fun `returns empty list for empty response`() {
        val result = mapper.mapToSyncedPlayers(emptyList())
        assertThat(result).isEmpty()
    }

    @Test
    fun `returns empty list for empty players array`() {
        val json = """[{"team": {"id": 1}, "players": []}]"""
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedPlayers(nodes)
        assertThat(result).isEmpty()
    }
}

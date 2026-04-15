package com.goalcast.apisport.mapper

import BaseUnitTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper

class SyncedTeamApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private fun parse(json: String) = objectMapper.readTree(json)

    private val validTeamsJson = """
        [
            {
                "team": {
                    "id": 1,
                    "name": "Belgium",
                    "code": "BEL",
                    "country": "Belgium",
                    "national": true,
                    "logo": "https://media.api-sports.io/football/teams/1.png"
                }
            },
            {
                "team": {
                    "id": 16,
                    "name": "Mexico",
                    "code": "MEX",
                    "country": "Mexico",
                    "national": true,
                    "logo": "https://media.api-sports.io/football/teams/16.png"
                }
            }
        ]
    """.trimIndent()

    @Test
    fun `maps valid teams response`() {
        val nodes = parse(validTeamsJson).toList()
        val result = mapper.mapToSyncedTeams(nodes)

        assertThat(result).hasSize(2)
        assertThat(result[0].apiId).isEqualTo(1)
        assertThat(result[0].name).isEqualTo("Belgium")
        assertThat(result[0].code).isEqualTo("BEL")
        assertThat(result[0].logo).isEqualTo("https://media.api-sports.io/football/teams/1.png")
        assertThat(result[0].isNational).isTrue()
    }

    @Test
    fun `maps empty response to empty list`() {
        val result = mapper.mapToSyncedTeams(emptyList())
        assertThat(result).isEmpty()
    }

    @Test
    fun `handles nullable code and logo`() {
        val json = """[{"team": {"id": 1, "name": "Test", "national": false}}]"""
        val nodes = parse(json).toList()
        val result = mapper.mapToSyncedTeams(nodes)

        assertThat(result[0].code).isNull()
        assertThat(result[0].logo).isNull()
        assertThat(result[0].isNational).isFalse()
    }
}

package com.goalcast.apisport.mapper

import BaseUnitTest
import com.goalcast.apisport.exception.MissingApiSportPropException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.CsvSource
import org.junit.jupiter.params.provider.MethodSource
import tools.jackson.databind.ObjectMapper
import java.util.stream.Stream

class SyncedTournamentApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()

    private val validJson = """
        {
            "league": {
                "id": 1,
                "name": "World Cup",
                "type": "Cup",
                "logo": "https://media.api-sports.io/football/leagues/1.png"
            },
            "country": {
                "name": "World",
                "code": null,
                "flag": null
            }
        }
    """.trimIndent()

    private fun parse(json: String) = objectMapper.readTree(json)

    @ParameterizedTest
    @CsvSource("Cup, true", "CUP, true", "cup, true", "League, false", "league, false")
    fun `maps valid response to SyncedTournament`(type: String, expected: Boolean) {
        val result = mapper.mapToSyncedTournament(
            parse(
                validJson.replace(
                    "\"Cup\"", "\"$type\""
                )
            ), 99, 2030
        )

        assertThat(result.apiId).isEqualTo(99)
        assertThat(result.name).isEqualTo("World Cup")
        assertThat(result.country).isEqualTo("World")
        assertThat(result.logo).isEqualTo("https://media.api-sports.io/football/leagues/1.png")
        assertThat(result.isCup).isEqualTo(expected)
        assertThat(result.isCup).isEqualTo(expected)
        assertThat(result.season).isEqualTo(2030)
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("missingOrBlankFields")
    @Suppress("UNUSED_PARAMETER")
    fun `throws when required field is missing or blank`(description: String, search: String, replace: String) {
        val json = validJson.replace(search, replace)

        assertThrows<MissingApiSportPropException> {
            mapper.mapToSyncedTournament(parse(json), 1, 2026)
        }
    }

    companion object {
        @JvmStatic
        fun missingOrBlankFields(): Stream<Arguments> = Stream.of(
            // missing fields
            Arguments.of("missing name", """"name":""", """"_name":"""),
            Arguments.of("missing type", """"type":""", """"_type":"""),
            Arguments.of("missing logo", """"logo":""", """"_logo":"""),
            Arguments.of("missing country name", """"name": "World"""", """"_name": "World""""),
            Arguments.of("missing league node", """"league"""", """"_league""""),
            // blank fields
            Arguments.of("blank name", "\"name\": \"World Cup\"", "\"name\": \"\""),
            Arguments.of("blank type", "\"type\": \"Cup\"", "\"type\": \"\""),
            Arguments.of(
                "blank logo",
                "\"logo\": \"https://media.api-sports.io/football/leagues/1.png\"",
                "\"logo\": \"\""
            ),
        )
    }
}

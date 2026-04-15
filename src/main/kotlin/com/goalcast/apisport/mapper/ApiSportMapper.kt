package com.goalcast.apisport.mapper

import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.apisport.exception.MissingApiSportPropException
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.exc.JsonNodeException

private fun JsonNode.requireString(field: String, id: Int, season: Int): String {
    return try {
        path(field).asString().ifBlank {
            throw MissingApiSportPropException(field, id, season)
        }
    } catch (_: JsonNodeException) {
        throw MissingApiSportPropException(field, id, season)
    }
}

@Component
class ApiSportMapper {
    fun mapToSyncedTournament(leaguesResponse: JsonNode, id: Int, season: Int): SyncedTournament {
        val leagueNode = leaguesResponse.path("league")

        return SyncedTournament(
            apiId = id,
            name = leagueNode.requireString("name", id, season),
            country = leaguesResponse.path("country").requireString("name", id, season),
            logo = leagueNode.requireString("logo", id, season),
            isCup = leagueNode.requireString("type", id, season).equals("cup", true),
            season = season,
        )
    }

    fun mapToSyncedTeams(response: List<JsonNode>): List<SyncedTeam> {
        return response.map { node ->
            val t = node.path("team")
            SyncedTeam(
                apiId = t.path("id").asInt(),
                name = t.path("name").asString(),
                code = t.path("code").asString(null),
                logo = t.path("logo").asString(null),
                isNational = t.path("national").asBoolean(false),
            )
        }
    }

    fun mapToSyncedPlayers(response: List<JsonNode>): List<SyncedPlayer> {
        if (response.isEmpty()) return emptyList()
        return response[0].path("players").map { p ->
            SyncedPlayer(
                apiId = p.path("id").asInt(),
                displayedName = p.path("name").asString(),
            )
        }
    }
}

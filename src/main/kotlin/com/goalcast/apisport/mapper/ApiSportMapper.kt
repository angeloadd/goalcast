package com.goalcast.apisport.mapper

import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedGoal
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTopScorer
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.apisport.exception.MissingApiSportPropException
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.exc.JsonNodeException
import java.time.Instant

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

    fun mapToSyncedGames(response: List<JsonNode>): List<SyncedGame> {
        return response.map { node ->
            val fixture = node.path("fixture")
            val round = node.path("league").path("round").asString()
            SyncedGame(
                apiId = fixture.path("id").asInt(),
                stage = round,
                phase = mapRoundToPhase(round),
                status = mapApiStatus(fixture.path("status").path("short").asString()),
                startedAt = Instant.ofEpochSecond(fixture.path("timestamp").asLong()),
                homeTeamApiId = node.path("teams").path("home").path("id").asInt(),
                awayTeamApiId = node.path("teams").path("away").path("id").asInt(),
                homeScore = node.path("goals").path("home").let { if (it.isNull) null else it.asInt() },
                awayScore = node.path("goals").path("away").let { if (it.isNull) null else it.asInt() },
            )
        }
    }

    fun mapToSyncedGoals(response: List<JsonNode>): List<SyncedGoal> {
        return response.mapNotNull { node ->
            val detail = node.path("detail").asString()
            if (detail.contains("Missed")) return@mapNotNull null

            val time = node.path("time")
            val elapsed = time.path("elapsed").asInt()
            val extra = if (time.path("extra").isNull) 0 else time.path("extra").asInt()
            val comment = node.path("comments").let { if (it.isNull) "" else it.asString() }

            if (elapsed == 120 && extra > 0 && comment.contains("Penalty", ignoreCase = true)) {
                return@mapNotNull null
            }

            SyncedGoal(
                playerApiId = node.path("player").path("id").asInt(),
                scoringTeamApiId = node.path("team").path("id").asInt(),
                isOwnGoal = detail.contains("Own", ignoreCase = true),
                scoredAt = elapsed + extra,
            )
        }
    }

    private fun mapRoundToPhase(round: String): GamePhase {
        return round.lowercase().let {
            when {
                it.contains("group") -> GamePhase.GROUP
                it.contains("32") -> GamePhase.ROUND_OF_32
                it.contains("16") -> GamePhase.ROUND_OF_16
                it.contains("quarter") -> GamePhase.QUARTER
                it.contains("semi") -> GamePhase.SEMI
                it.contains("3rd") -> GamePhase.FINAL_3_4
                it.contains("final") && !it.contains("semi") && !it.contains("quarter") && !it.contains("3rd") -> GamePhase.FINAL
                else -> GamePhase.GROUP
            }
        }
    }

    private fun mapApiStatus(short: String): GameStatus = when (short) {
        "FT", "AET", "PEN" -> GameStatus.FINISHED
        "1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE" -> GameStatus.ONGOING
        else -> GameStatus.NOT_STARTED
    }

    fun mapWinnerTeamApiId(fixtureNode: JsonNode): Int? {
        val home = fixtureNode.path("teams").path("home")
        val away = fixtureNode.path("teams").path("away")
        return when {
            home.path("winner").asBoolean(false) -> home.path("id").asInt()
            away.path("winner").asBoolean(false) -> away.path("id").asInt()
            else -> null
        }
    }

    fun mapToSyncedTopScorers(response: List<JsonNode>): List<SyncedTopScorer> {
        if (response.isEmpty()) return emptyList()
        val topGoals = response[0].path("statistics")[0].path("goals").path("total").asInt()
        return response.takeWhile {
            it.path("statistics")[0].path("goals").path("total").asInt() >= topGoals
        }.map {
            SyncedTopScorer(playerApiId = it.path("player").path("id").asInt())
        }
    }
}

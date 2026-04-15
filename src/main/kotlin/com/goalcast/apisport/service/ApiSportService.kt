package com.goalcast.apisport.service

import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.*
import com.goalcast.apisport.exception.TournamentNotFoundException
import com.goalcast.apisport.mapper.ApiSportMapper
import org.springframework.stereotype.Service

@Service
class ApiSportService(private val apiSportClient: ApiSportClient, private val mapper: ApiSportMapper) {

    fun getTournament(id: Int, season: Int): SyncedTournament {
        val results = apiSportClient.get(
            "leagues",
            mapOf("id" to id.toString(), "season" to season.toString())
        ).ifEmpty { throw TournamentNotFoundException(id, season) }

        return mapper.mapToSyncedTournament(results[0], id, season)
    }

    fun getTeams(leagueId: Int, season: Int): List<SyncedTeam> {
        val results = apiSportClient.get(
            "teams",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedTeams(results)
    }

    fun getPlayers(teamApiId: Int): List<SyncedPlayer> {
        val results = apiSportClient.get(
            "players/squads",
            mapOf("team" to teamApiId.toString())
        )
        return mapper.mapToSyncedPlayers(results)
    }

    fun getGames(leagueId: Int, season: Int): List<SyncedGame> {
        val results = apiSportClient.get(
            "fixtures",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedGames(results)
    }

    fun getGoals(fixtureId: Int): List<SyncedGoal> {
        val results = apiSportClient.get(
            "fixtures/events",
            mapOf("fixture" to fixtureId.toString(), "type" to "Goal")
        )
        return mapper.mapToSyncedGoals(results)
    }

    fun getFixtureWinnerTeamApiId(fixtureId: Int): Int? {
        val results = apiSportClient.get(
            "fixtures",
            mapOf("id" to fixtureId.toString())
        )
        if (results.isEmpty()) return null
        return mapper.mapWinnerTeamApiId(results[0])
    }

    fun getTopScorers(leagueId: Int, season: Int): List<SyncedTopScorer> {
        val results = apiSportClient.get(
            "players/topscorers",
            mapOf("league" to leagueId.toString(), "season" to season.toString())
        )
        return mapper.mapToSyncedTopScorers(results)
    }
}

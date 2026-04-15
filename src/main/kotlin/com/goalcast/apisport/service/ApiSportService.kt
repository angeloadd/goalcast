package com.goalcast.apisport.service

import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedTournament
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

}

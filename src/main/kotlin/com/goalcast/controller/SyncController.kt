package com.goalcast.controller

import com.goalcast.apisport.service.ApiSportService
import com.goalcast.service.ApiSportSyncService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

/**
 * Temporary controller for manually testing ApiSport sync.
 * TODO: replace with owner-only controller later.
 */
@RestController
@RequestMapping("/api/sync")
class SyncController(
    private val apiSportService: ApiSportService,
    private val syncService: ApiSportSyncService,
) {
    @PostMapping("/tournament")
    @ResponseStatus(HttpStatus.OK)
    fun syncTournament() = mapOf("result" to syncService.syncTournament(apiSportService.getTournament(1, 2022)).name)

    @PostMapping("/teams")
    @ResponseStatus(HttpStatus.OK)
    fun syncTeams(): Map<String, String> {
        syncService.syncTeams(apiSportService.getTeams(1, 2022))
        return mapOf("result" to "ok")
    }

    @PostMapping("/players")
    @ResponseStatus(HttpStatus.OK)
    fun syncPlayers(): Map<String, String> {
        val teamApiIds = syncService.getTeamApiIdsForTournament()
        for (teamApiId in teamApiIds) {
            syncService.syncPlayers(teamApiId, apiSportService.getPlayers(teamApiId))
        }
        return mapOf("result" to "ok")
    }

    @PostMapping("/players/{teamApiId}")
    @ResponseStatus(HttpStatus.OK)
    fun syncPlayersForTeam(@PathVariable teamApiId: Int): Map<String, String> {
        syncService.syncPlayers(teamApiId, apiSportService.getPlayers(teamApiId))
        return mapOf("result" to "ok")
    }

    @PostMapping("/games")
    @ResponseStatus(HttpStatus.OK)
    fun syncGames(): Map<String, String> {
        syncService.syncGames(apiSportService.getGames(1, 2022))
        return mapOf("result" to "ok")
    }

    @PostMapping("/statuses")
    @ResponseStatus(HttpStatus.OK)
    fun syncStatuses(): Map<String, Any> {
        val finished = syncService.syncGameStatuses()
        return mapOf("newlyFinished" to finished.size)
    }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.OK)
    fun syncMissingGoals(): Map<String, String> {
        syncService.syncMissingGoals()
        return mapOf("result" to "ok")
    }

    @PostMapping("/goals/{gameApiId}")
    @ResponseStatus(HttpStatus.OK)
    fun syncGoalsForGame(@PathVariable gameApiId: Int): Map<String, String> {
        val goals = apiSportService.getGoals(gameApiId)
        syncService.syncGoals(gameApiId, goals)
        return mapOf("result" to "ok", "goals" to goals.size.toString())
    }

    @PostMapping("/winner")
    @ResponseStatus(HttpStatus.OK)
    fun syncWinnerAndTopScorers(): Map<String, String> {
        syncService.syncWinnerAndTopScorers()
        return mapOf("result" to "ok")
    }

    @PostMapping("/all")
    @ResponseStatus(HttpStatus.OK)
    fun syncAll(): Map<String, String> {
        syncService.syncTournament(apiSportService.getTournament(1, 2022))
        syncService.syncTeams(apiSportService.getTeams(1, 2022))
        syncService.syncGames(apiSportService.getGames(1, 2022))
        return mapOf("result" to "ok")
    }
}

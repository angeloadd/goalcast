package com.goalcast.scheduler

import com.goalcast.apisport.service.ApiSportService
import com.goalcast.service.ApiSportSyncService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class ApiSportScheduler(
    private val apiSportService: ApiSportService,
    private val syncService: ApiSportSyncService,
) {
    companion object {
        private val log = LoggerFactory.getLogger(ApiSportScheduler::class.java)
        private const val SEASON = 2026
        private const val API_ID = 1
    }

    // Daily at 06:00 UTC (08:00 Berlin) — sync tournament metadata
    @Scheduled(cron = "0 0 6 * * *")
    fun syncTournament() {
        runSync("tournament") {
            val synced = apiSportService.getTournament(API_ID, SEASON)
            syncService.syncTournament(synced)
        }
    }

    // Daily at 07:00 UTC (09:00 Berlin) — sync teams
    @Scheduled(cron = "0 0 7 * * *")
    fun syncTeams() {
        runSync("teams") {
            val teams = apiSportService.getTeams(API_ID, SEASON)
            syncService.syncTeamsForTournamentWithApiIdAndSeason(API_ID, SEASON, teams)
        }
    }

    // Daily at 08:00 UTC (10:00 Berlin) — sync players (slow due to rate limiting)
    @Scheduled(cron = "0 0 8 * * *")
    fun syncPlayers() {
        runSync("players") {
            syncService.getTeamApiIdsForTournament(API_ID, SEASON).forEach {
                val players = apiSportService.getPlayers(it)
                syncService.syncPlayers(API_ID, SEASON, it, players)
            }
        }
    }

    // Daily at 09:00 UTC (11:00 Berlin) — sync game schedule
    @Scheduled(cron = "0 0 9 * * *")
    fun syncGames() {
        runSync("games") {
            val games = apiSportService.getGames(API_ID, SEASON)
            syncService.syncGames(API_ID, SEASON, games)
        }
    }

    // Every 5 minutes between 15:00 and 05:59 UTC (17:00–07:59 Berlin, match window)
    @Scheduled(cron = "0 */5 15-23,0-5 * * *")
    fun liveSync() {
        runSync("live") {
            val newlyFinished = syncService.syncGameStatuses(API_ID, SEASON)
            if (newlyFinished.isNotEmpty()) {
                log.info("{} games just finished, checking goals", newlyFinished.size)
            }
            syncService.syncMissingGoals(API_ID, SEASON)
            syncService.syncWinnerAndTopScorers(API_ID, SEASON)
        }
    }

    private fun runSync(name: String, block: () -> Unit) {
        try {
            log.info("Starting {} sync", name)
            block()
            log.info("Completed {} sync", name)
        } catch (e: Exception) {
            log.error("Failed {} sync: {}", name, e.message, e)
        }
    }
}

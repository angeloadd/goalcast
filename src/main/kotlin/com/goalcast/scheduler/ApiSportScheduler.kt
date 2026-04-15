package com.goalcast.scheduler

import com.goalcast.apisport.service.ApiSportService
import com.goalcast.service.ApiSportSyncService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class ApiSportScheduler(
    private val syncService: ApiSportSyncService,
    private val apiSportService: ApiSportService,
) {
    private val log = LoggerFactory.getLogger(ApiSportScheduler::class.java)

    // Daily at 06:00 UTC (08:00 Berlin) — sync tournament metadata
    @Scheduled(cron = "0 0 6 * * *")
    fun syncTournament() {
        log.info("Tournament[id={},season={}]: start syncing process", 1, 2026)

        apiSportService.getTournament(1, 2026).run {
            syncService.syncTournament(this)
        }
    }

    // Daily at 07:00 UTC (09:00 Berlin) — sync teams
    @Scheduled(cron = "0 0 7 * * *")
    fun syncTeams() {
        log.info("Syncing teams")
        syncService.syncTeams()
    }

    // Daily at 08:00 UTC (10:00 Berlin) — sync players (slow due to rate limiting)
    @Scheduled(cron = "0 0 8 * * *")
    fun syncPlayers() {
        log.info("Syncing players")
        syncService.syncPlayers()
    }

    // Daily at 09:00 UTC (11:00 Berlin) — sync game schedule
    @Scheduled(cron = "0 0 9 * * *")
    fun syncGames() {
        log.info("Syncing games")
        syncService.syncGames()
    }

    // Every 5 minutes between 15:00 and 05:59 UTC (17:00–07:59 Berlin, match window)
    // - Checks if any not_started games should be ongoing, or ongoing games have finished (1 API call, or 0 if nothing to check)
    // - For finished games, checks if goal count matches score and re-syncs if needed (1 API call per game with missing goals)
    @Scheduled(cron = "0 */5 15-23,0-5 * * *")
    fun liveSync() {
        val newlyFinished = syncService.syncGameStatuses()
        if (newlyFinished.isNotEmpty()) {
            log.info("{} games just finished, checking goals", newlyFinished.size)
        }
        syncService.syncMissingGoals()
    }
}

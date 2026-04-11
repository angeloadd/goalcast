package com.goalcast.scheduler

import com.goalcast.service.ApiSportSyncService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class ApiSportScheduler(
    private val syncService: ApiSportSyncService,
) {
    private val log = LoggerFactory.getLogger(ApiSportScheduler::class.java)

    // Daily at 03:00 — sync teams and game schedule
    @Scheduled(cron = "0 0 3 * * *")
    fun dailySync() {
        log.info("Starting daily sync")
        syncService.syncTeams()
        syncService.syncGames()
        log.info("Daily sync complete")
    }

    // Daily at 04:00 — sync players (slow due to rate limiting)
    @Scheduled(cron = "0 0 4 * * *")
    fun dailyPlayerSync() {
        log.info("Starting player sync")
        syncService.syncPlayers()
        log.info("Player sync complete")
    }

    // Every 2 minutes — sync live game results and goals
    @Scheduled(fixedRate = 120_000)
    fun liveResultsSync() {
        syncService.syncGames()
        syncService.syncAllGoalsForLiveGames()
    }
}

package com.goalcast.apisport.dto

import java.time.Instant

data class SyncedGame(
    val apiId: Int,
    val stage: String,
    val phase: GamePhase,
    val status: GameStatus,
    val startedAt: Instant,
    val homeTeamApiId: Int,
    val awayTeamApiId: Int,
    val homeScore: Int?,
    val awayScore: Int?,
)

package com.goalcast.apisport.dto

data class SyncedGoal(
    val playerApiId: Int,
    val scoringTeamApiId: Int,
    val isOwnGoal: Boolean,
    val scoredAt: Int,
)

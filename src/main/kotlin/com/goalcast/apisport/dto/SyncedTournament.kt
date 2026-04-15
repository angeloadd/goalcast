package com.goalcast.apisport.dto

data class SyncedTournament(
    val apiId: Int,
    val name: String,
    val country: String,
    val logo: String,
    val isCup: Boolean,
    val season: Int,
)

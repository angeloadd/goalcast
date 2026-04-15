package com.goalcast.apisport.dto

data class SyncedTeam(
    val apiId: Int,
    val name: String,
    val code: String?,
    val logo: String?,
    val isNational: Boolean,
)

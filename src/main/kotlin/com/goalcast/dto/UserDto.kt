package com.goalcast.dto

data class UserDto(
    val username: String,
    val email: String,
    val roles: List<String>,
)

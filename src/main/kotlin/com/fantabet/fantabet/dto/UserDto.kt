package com.fantabet.fantabet.dto

data class UserDto(
    val username: String,
    val email: String,
    val roles: List<String>,
)

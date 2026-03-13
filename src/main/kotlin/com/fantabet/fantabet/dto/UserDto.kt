package com.fantabet.fantabet.dto

data class UserDto(
    val username: String = "ciao",
    val email: String,
    val roles: List<String>,
)

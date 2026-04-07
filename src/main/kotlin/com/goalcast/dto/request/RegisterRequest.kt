package com.goalcast.dto.request

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 2, max = 50) val username: String,
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 12) val password: String,
)

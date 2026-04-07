package com.goalcast.service

import com.goalcast.dto.UserDto
import com.goalcast.dto.request.RegisterRequest
import com.goalcast.entity.User
import com.goalcast.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) {
    @Transactional
    fun register(request: RegisterRequest): UserDto {
        require(!userRepository.existsByUsername(request.username)) {
            "Username already taken"
        }
        require(!userRepository.existsByEmail(request.email)) {
            "Email already registered"
        }

        val hashedPassword = requireNotNull(passwordEncoder.encode(request.password))
        val user = User(
            username = request.username,
            email = request.email,
            password = hashedPassword
        )
        userRepository.save(user)

        return UserDto(user.username, user.email, listOf("ROLE_USER"))
    }
}

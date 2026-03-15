package com.fantabet.fantabet.service

import com.fantabet.fantabet.dto.request.RegisterRequest
import com.fantabet.fantabet.repository.UserRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.security.crypto.password.PasswordEncoder

class UserServiceTest {
    private val userRepository: UserRepository = mockk()
    private val passwordEncoder: PasswordEncoder = mockk()
    private val userService = UserService(userRepository, passwordEncoder)

    @Test
    fun `register creates user with hashed password`() {
        every { userRepository.existsByUsername("cicciofrizzo") } returns false
        every { userRepository.existsByEmail("ciccio@email.com") } returns false
        every { passwordEncoder.encode("Adamo123") } returns "hashed"
        every { userRepository.save(any()) } answers { firstArg() }

        val result = userService.register(
            RegisterRequest("cicciofrizzo", "ciccio@email.com", "Adamo123")
        )

        verify { passwordEncoder.encode("Adamo123") }
        assertThat(result.username).isEqualTo("cicciofrizzo")
    }

    @Test
    fun `register throws when username already taken`() {
        every { userRepository.existsByUsername("cicciofrizzo") } returns true

        assertThrows<IllegalArgumentException> {
            userService.register(
                RegisterRequest("cicciofrizzo", "ciccio@email.com", "Adamo123")
            )
        }
    }

    @Test
    fun `register throws when email already registered`() {
        every { userRepository.existsByUsername("cicciofrizzo") } returns false
        every { userRepository.existsByEmail("ciccio@email.com") } returns true

        assertThrows<IllegalArgumentException> {
            userService.register(
                RegisterRequest("cicciofrizzo", "ciccio@email.com", "Adamo123")
            )
        }
    }
}

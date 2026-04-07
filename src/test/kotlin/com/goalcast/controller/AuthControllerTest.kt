package com.goalcast.controller

import com.goalcast.entity.User
import com.goalcast.repository.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var passwordEncoder: PasswordEncoder

    @BeforeEach
    fun setup() {
        userRepository.deleteAll()
        val hashedPassword = requireNotNull(passwordEncoder.encode("Adamo123"))
        userRepository.save(
            User(
                username = "cicciofrizzo",
                email = "ciccio@email.com",
                password = hashedPassword
            )
        )
    }

    @Test
    fun `login with valid credentials returns 200 and user data`() {
        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "cicciofrizzo", "password": "Adamo123"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.username") { value("cicciofrizzo") }
            jsonPath("$.roles[0]") { value("ROLE_USER") }
        }
    }

    @Test
    fun `login with invalid credentials returns 401`() {
        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "cicciofrizzo", "password": "wrong"}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `accessing protected endpoint without session returns 401`() {
        mockMvc.get("/api/auth/me").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `register creates new user and returns 201`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "newuser", "email": "new@email.com", "password": "password123"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.username") { value("newuser") }
        }
    }

    @Test
    fun `register with existing username returns 400`() {
        mockMvc.post("/api/auth/register") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "cicciofrizzo", "email": "another@email.com", "password": "password123"}"""
        }.andExpect {
            status { isBadRequest() }
        }
    }
}

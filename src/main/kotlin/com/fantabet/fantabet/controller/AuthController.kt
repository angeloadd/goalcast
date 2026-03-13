package com.fantabet.fantabet.controller

import com.fantabet.fantabet.dto.LoginRequest
import com.fantabet.fantabet.dto.RegisterRequest
import com.fantabet.fantabet.dto.UserDto
import com.fantabet.fantabet.service.UserService
import jakarta.servlet.http.HttpSession
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
) {
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest, session: HttpSession): ResponseEntity<UserDto> {
        val authToken = UsernamePasswordAuthenticationToken(request.username, request.password)
        val authentication = authenticationManager.authenticate(authToken)

        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication
        SecurityContextHolder.setContext(context)
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        )

        val user = authentication.principal as UserDetails
        return ResponseEntity.ok(UserDto(user.username, user.username, user.authorities.mapNotNull { it.authority }))
    }

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<UserDto> {
        val user = userService.register(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(user)
    }

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal user: UserDetails?): ResponseEntity<UserDto> {
        return if (user != null) {
            ResponseEntity.ok(UserDto(user.username, user.username, user.authorities.mapNotNull { it.authority }))
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }
    }
}

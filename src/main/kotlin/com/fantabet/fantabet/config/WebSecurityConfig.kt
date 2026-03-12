package com.fantabet.fantabet.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class WebSecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            // Kotlin security extensions allow concise DSL instead of builder-style lambdas
            authorizeHttpRequests {
                authorize("/", permitAll)
                authorize("/home", permitAll)
                authorize(anyRequest, authenticated)
            }
            formLogin {
                loginPage = "/login"
                permitAll()
            }
            logout {
                permitAll()
            }
        }

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return encoder
    }

    @Bean
    fun userDetailsService(): UserDetailsService {
        val password = encoder.encode("Adamo123")
        val user = User.builder()
            .username("cicciofrizzo")
            .password(password)
            .roles("USER")
            .build()

        return InMemoryUserDetailsManager(user)
    }

    companion object {
        private val encoder = Argon2PasswordEncoder(
            16,
            32,
            1,
            64,
            3
        )
    }
}

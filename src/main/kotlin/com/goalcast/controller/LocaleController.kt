package com.goalcast.controller

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/locale")
class LocaleController {

    companion object {
        private val SUPPORTED_LOCALES = setOf("en", "it")
        private const val COOKIE_NAME = "gclocale"
        private const val MAX_AGE_SECONDS = 365 * 24 * 60 * 60
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun setLocale(@RequestBody request: LocaleRequest, response: HttpServletResponse) {
        val locale = if (request.locale in SUPPORTED_LOCALES) request.locale else "en"
        val cookie = Cookie(COOKIE_NAME, locale).apply {
            path = "/"
            maxAge = MAX_AGE_SECONDS
            isHttpOnly = true
        }
        response.addCookie(cookie)
    }
}

data class LocaleRequest(val locale: String)

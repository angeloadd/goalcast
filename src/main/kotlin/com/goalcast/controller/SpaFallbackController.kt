package com.goalcast.controller

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Controller
class SpaFallbackController {

    companion object {
        private val SUPPORTED_LOCALES = setOf("en", "it")
        private const val DEFAULT_LOCALE = "en"
    }

    @RequestMapping(
        value = ["/", "/{path:^(?!api|static|assets|en|it|.*\\.).*}/**"],
        method = [RequestMethod.GET]
    )
    fun forward(@CookieValue(name = "gclocale", defaultValue = DEFAULT_LOCALE) locale: String): String {
        val resolvedLocale = if (locale in SUPPORTED_LOCALES) locale else DEFAULT_LOCALE
        return "forward:/$resolvedLocale/index.html"
    }
}

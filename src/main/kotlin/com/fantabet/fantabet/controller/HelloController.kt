package com.fantabet.fantabet.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {
    @GetMapping("/greetings")
    fun index(@RequestParam name: String? = null): String {
        return if (name != null) "Hello $name!" else "Hello World!"
    }
}

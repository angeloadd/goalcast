package com.fantabet.fantabet.controller

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Controller
class SpaFallbackController {
    @RequestMapping(
        value = ["/{path:^(?!api|static|assets|.*\\.).*}/**"],
        method = [RequestMethod.GET]
    )
    fun forward(): String {
        return "forward:/index.html"
    }
}

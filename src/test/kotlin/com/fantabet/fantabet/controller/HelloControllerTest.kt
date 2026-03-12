package com.fantabet.fantabet.controller

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class HelloControllerTest(@Autowired private val mvc: MockMvc) {

    @Test
    fun `should return hello world`() {
        mvc.get("/") {
            accept(MediaType.TEXT_HTML)

        }.andExpect {
            status { isOk() }
            content { string("<h1>Hello World!</h1>") }
        }
    }
}

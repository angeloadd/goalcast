package com.fantabet.fantabet

import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Bean


@SpringBootApplication
class FantabetApplication {
    @Bean
    fun commandLineRunner(ctx: ApplicationContext) = CommandLineRunner {
        println("Started application: ${ctx.environment.getProperty("spring.application.name")}")
        ctx.environment.getProperty("local.server.port").let { println("Server port: $it") }
    }
}

fun main(args: Array<String>) {
    runApplication<FantabetApplication>(*args)
}

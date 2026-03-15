package com.fantabet.fantabet

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@EnableRedisRepositories(basePackages = [])
@EnableRedisHttpSession
@SpringBootApplication
class FantabetApplication

fun main(args: Array<String>) {
    runApplication<FantabetApplication>(*args)
}

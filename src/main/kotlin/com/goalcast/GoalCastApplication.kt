package com.goalcast

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@EnableRedisRepositories(basePackages = [])
@EnableRedisHttpSession
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
class GoalCastApplication

fun main(args: Array<String>) {
    runApplication<GoalCastApplication>(*args)
}

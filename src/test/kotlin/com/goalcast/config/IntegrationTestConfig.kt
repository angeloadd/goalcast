package com.goalcast.config

import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.cache.CacheManager
import org.springframework.context.annotation.Configuration
import org.springframework.cache.concurrent.ConcurrentMapCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Profile
import org.springframework.session.MapSessionRepository
import org.springframework.session.config.annotation.web.http.EnableSpringHttpSession
import org.testcontainers.containers.PostgreSQLContainer
import java.util.concurrent.ConcurrentHashMap

@Configuration
@Profile("testing")
@EnableSpringHttpSession
class IntegrationTestConfig {

    @Bean
    @ServiceConnection
    fun postgres(): PostgreSQLContainer<*> =
        PostgreSQLContainer("postgres:17")

    @Bean
    fun sessionRepository(): MapSessionRepository =
        MapSessionRepository(ConcurrentHashMap())

    @Bean
    fun cacheManager(): CacheManager = ConcurrentMapCacheManager()
}
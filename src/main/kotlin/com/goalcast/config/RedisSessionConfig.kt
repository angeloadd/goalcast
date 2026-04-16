package com.goalcast.config

import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession

@Configuration
@Profile("!testing")
@EnableRedisRepositories(basePackages = [])
@EnableRedisHttpSession
class RedisSessionConfig
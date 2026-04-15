package com.goalcast.apisport.config

import io.mockk.mockk
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.web.client.RestClient

@Configuration
@Profile("testing")
class ApiSportTestConfig {
    @Bean
    fun apiSportRestClient() = mockk<RestClient>()

}

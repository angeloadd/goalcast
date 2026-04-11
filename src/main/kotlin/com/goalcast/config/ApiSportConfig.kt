package com.goalcast.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

@ConfigurationProperties(prefix = "apisport")
data class ApiSportProperties(
    val baseUrl: String = "https://v3.football.api-sports.io",
    val apiKey: String = "",
    val leagueId: Int = 1,
    val season: Int = 2026,
)

@Configuration
class ApiSportConfig {

    @Bean
    fun apiSportRestClient(properties: ApiSportProperties): RestClient {
        return RestClient.builder()
            .baseUrl(properties.baseUrl)
            .defaultHeader("x-apisports-key", properties.apiKey)
            .build()
    }
}

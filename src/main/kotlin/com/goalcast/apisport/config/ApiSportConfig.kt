package com.goalcast.apisport.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import org.springframework.web.client.RestClient

@ConfigurationProperties(prefix = "apisport")
@Profile("!testing")
data class ApiSportProperties(
    val baseUrl: String = "",
    val apiKey: String = "",
)

@Configuration
@Profile("!testing")
class ApiSportConfig {
    companion object {
        private const val APISPORT_KEY_HEADER = "x-apisports-key"
    }

    @Bean
    fun apiSportRestClient(properties: ApiSportProperties): RestClient {
        return RestClient.builder()
            .baseUrl(properties.baseUrl)
            .defaultHeader(APISPORT_KEY_HEADER, properties.apiKey)
            .build()
    }
}

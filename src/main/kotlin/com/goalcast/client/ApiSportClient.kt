package com.goalcast.client

import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class ApiSportClient(
    private val apiSportRestClient: RestClient,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(ApiSportClient::class.java)

    fun get(endpoint: String, params: Map<String, String> = emptyMap()): List<JsonNode> {
        val uri = buildString {
            append("/")
            append(endpoint)
            if (params.isNotEmpty()) {
                append("?")
                append(params.entries.joinToString("&") { "${it.key}=${it.value}" })
            }
        }
        log.info("ApiSport GET {}", uri)

        val body = apiSportRestClient.get()
            .uri(uri)
            .retrieve()
            .body(String::class.java)

        val root = objectMapper.readTree(body)
        val errors = root.path("errors")
        if (errors.isObject && errors.has("token")) {
            throw IllegalStateException("Invalid ApiSport token")
        }

        val response = root.path("response")
        if (!response.isArray) {
            throw IllegalStateException("Unexpected ApiSport response: missing 'response' array")
        }

        log.info("ApiSport returned {} results", response.size())
        return response.toList()
    }
}

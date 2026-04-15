package com.goalcast.apisport.client

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

@Component
class ApiSportClient(
    private val apiSportRestClient: RestClient,
    private val objectMapper: ObjectMapper,
    private val rateLimiter: RateLimiter,
) {
    private val log = LoggerFactory.getLogger(ApiSportClient::class.java)

    fun get(endpoint: String, params: Map<String, String> = emptyMap()): List<JsonNode> {
        rateLimiter.waitIfNeeded()
        log.info("ApiSport GET /{} params={}", endpoint, params)

        val body = fetch(endpoint, params)
        val root = objectMapper.readTree(body)

        checkForErrors(root)
        return extractResponse(root)
    }

    private fun fetch(endpoint: String, params: Map<String, String>): String {
        return requireNotNull(
            apiSportRestClient.get()
            .uri(endpoint) { builder ->
                params.forEach { (key, value) -> builder.queryParam(key, value) }
                builder.build()
            }
            .exchange { _, clientResponse ->
                val remaining = clientResponse.headers.getFirst("x-ratelimit-remaining")?.toIntOrNull()
                rateLimiter.update(remaining)
                clientResponse.bodyTo(String::class.java)
            }) { "Empty response from ApiSport" }
    }

    private fun checkForErrors(root: JsonNode) {
        val errors = root.path("errors")
        if (errors.isObject && errors.has("token")) {
            throw IllegalStateException("Invalid ApiSport token")
        }
    }

    private fun extractResponse(root: JsonNode): List<JsonNode> {
        val responseArray = root.path("response")
        if (!responseArray.isArray) {
            throw IllegalStateException("Unexpected ApiSport response: missing 'response' array")
        }
        log.info("ApiSport returned {} results", responseArray.size())
        return responseArray.toList()
    }
}

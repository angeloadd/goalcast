package com.goalcast.apisport.client

import BaseUnitTest
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import org.springframework.http.HttpHeaders
import org.springframework.http.client.ClientHttpRequest
import org.springframework.web.client.RestClient
import org.springframework.web.util.UriBuilder
import tools.jackson.databind.ObjectMapper
import java.net.URI
import java.util.function.Function

class ApiSportClientTest : BaseUnitTest() {
    @InjectMockKs
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var apiSportRestClient: RestClient

    @MockK
    lateinit var objectMapper: ObjectMapper

    @MockK(relaxUnitFun = true)
    lateinit var rateLimiter: RateLimiter

    private val realMapper = ObjectMapper()

    private fun mockRestClientResponse(body: String?, rateLimitRemaining: String? = "9") {
        val requestHeadersUriSpec = mockk<RestClient.RequestHeadersUriSpec<*>>(relaxed = true)
        val requestHeadersSpec = mockk<RestClient.RequestHeadersSpec<*>>()

        every { apiSportRestClient.get() } returns requestHeadersUriSpec
        every {
            (requestHeadersUriSpec).uri(
                any<String>(),
                any<Function<UriBuilder, URI>>()
            )
        } returns requestHeadersSpec

        every { requestHeadersSpec.exchange<String>(any()) } answers {
            val exchangeFn = firstArg<RestClient.RequestHeadersSpec.ExchangeFunction<String>>()
            val clientRequest = mockk<ClientHttpRequest>()
            val clientResponse = mockk<RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse>()
            val headers = HttpHeaders()
            if (rateLimitRemaining != null) {
                headers.add("x-ratelimit-remaining", rateLimitRemaining)
            }
            every { clientResponse.headers } returns headers
            every { clientResponse.bodyTo(String::class.java) } returns body
            exchangeFn.exchange(clientRequest, clientResponse)
        }

        if (body != null) {
            every { objectMapper.readTree(body) } returns realMapper.readTree(body)
        }
    }

    @Test
    fun `get returns response array as list of JsonNodes`() {
        val json = """{"response": [{"id": 1}, {"id": 2}], "errors": []}"""
        mockRestClientResponse(json)

        val result = apiSportClient.get("teams", mapOf("league" to "1"))

        assertThat(result).hasSize(2)
        assertThat(result[0].path("id").asInt()).isEqualTo(1)
        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
    }

    @Test
    fun `get returns empty list when response array is empty`() {
        val json = """{"response": [], "errors": []}"""
        mockRestClientResponse(json)

        val result = apiSportClient.get("teams")

        assertThat(result).isEmpty()
        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
    }

    @ParameterizedTest
    @CsvSource(value = ["3", "null"], nullValues = ["null"])
    fun `get passes rateLimitRemaining header to rateLimiter update`(remaining: String?) {
        val json = """{"response": [], "errors": []}"""
        mockRestClientResponse(json, rateLimitRemaining = remaining)

        apiSportClient.get("teams")

        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
        verify(exactly = 1) { rateLimiter.update(remaining?.toInt()) }
    }

    @Test
    fun `get throws when token error is present`() {
        val json = """{"response": [], "errors": {"token": "invalid"}}"""
        mockRestClientResponse(json)

        assertThrows<IllegalStateException> { apiSportClient.get("teams") }

        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
    }

    @Test
    fun `get throws when body is null`() {
        mockRestClientResponse(null)

        assertThrows<IllegalArgumentException> { apiSportClient.get("teams") }

        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
    }

    @Test
    fun `get throws when response is not an array`() {
        val json = """{"errors": []}"""
        mockRestClientResponse(json)

        assertThrows<IllegalStateException> { apiSportClient.get("teams") }

        verify(exactly = 1) { rateLimiter.waitIfNeeded() }
    }
}

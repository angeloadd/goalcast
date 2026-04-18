package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.GameGoalRepository
import com.goalcast.repository.GameRepository
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpHeaders
import org.springframework.http.client.ClientHttpRequest
import org.springframework.web.client.RestClient
import org.springframework.web.util.UriBuilder
import java.net.URI
import java.time.Instant
import java.util.function.Function

class SyncedMissingGoalApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var gameGoalRepository: GameGoalRepository

    @Autowired
    lateinit var gameRepository: GameRepository

    @Autowired
    lateinit var apiSportRestClient: RestClient

    private val tournamentApiId = 1
    private val season = 2022

    @BeforeEach
    fun setUp() {
        clearMocks(apiSportRestClient)

        syncService.syncTournament(
            SyncedTournament(
                apiId = tournamentApiId, name = "World Cup", country = "World",
                logo = "https://example.com/logo.png", isCup = true, season = season,
            )
        )
        syncService.syncTeamsForTournamentWithApiIdAndSeason(
            tournamentApiId, season, listOf(
                SyncedTeam(apiId = 10, name = "Brazil", code = "BRA", logo = null, isNational = true),
                SyncedTeam(apiId = 20, name = "Germany", code = "GER", logo = null, isNational = true),
            )
        )
        syncService.syncPlayers(
            tournamentApiId, season, 10, listOf(
                SyncedPlayer(apiId = 100, displayedName = "Neymar Jr"),
            )
        )
        syncService.syncGames(
            tournamentApiId, season, listOf(
                SyncedGame(
                    apiId = 1001, stage = "Group Stage - 1", phase = GamePhase.GROUP,
                    status = GameStatus.FINISHED,
                    startedAt = Instant.parse("2022-11-20T16:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = 1, awayScore = 0,
                )
            )
        )
    }

    @Test
    fun `syncMissingGoals fetches goals when count does not match score`() {
        mockRestClientResponse(
            """{"response": [{"detail": "Normal Goal", "time": {"elapsed": 45, "extra": null}, "comments": null, "player": {"id": 100}, "team": {"id": 10}}], "errors": []}"""
        )

        syncService.syncMissingGoals(tournamentApiId, season)

        val game = gameRepository.findByApiId(1001)!!
        val goals = gameGoalRepository.findByGameId(game.id)
        assertThat(goals).hasSize(1)
        assertThat(goals[0].player.apiId).isEqualTo(100)
        assertThat(goals[0].scoredAt).isEqualTo(45)
    }

    private fun mockRestClientResponse(body: String) {
        val requestHeadersUriSpec = mockk<RestClient.RequestHeadersUriSpec<*>>(relaxed = true)
        val requestHeadersSpec = mockk<RestClient.RequestHeadersSpec<*>>()

        every { apiSportRestClient.get() } returns requestHeadersUriSpec
        every { requestHeadersUriSpec.uri(any<String>(), any<Function<UriBuilder, URI>>()) } returns requestHeadersSpec
        every { requestHeadersSpec.exchange<String>(any()) } answers {
            val exchangeFn = firstArg<RestClient.RequestHeadersSpec.ExchangeFunction<String>>()
            val clientRequest = mockk<ClientHttpRequest>()
            val clientResponse = mockk<RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse>()
            val headers = HttpHeaders()
            headers.add("x-ratelimit-remaining", "9")
            every { clientResponse.headers } returns headers
            every { clientResponse.bodyTo(String::class.java) } returns body
            exchangeFn.exchange(clientRequest, clientResponse)
        }
    }
}
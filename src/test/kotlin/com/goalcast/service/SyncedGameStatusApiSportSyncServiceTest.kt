package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.GameRepository
import com.goalcast.repository.GameTeamRepository
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

class SyncedGameStatusApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var gameRepository: GameRepository

    @Autowired
    lateinit var gameTeamRepository: GameTeamRepository

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
        syncService.syncGames(
            tournamentApiId, season, listOf(
                SyncedGame(
                    apiId = 1001, stage = "Group Stage - 1", phase = GamePhase.GROUP,
                    status = GameStatus.NOT_STARTED,
                    startedAt = Instant.parse("2022-11-20T16:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = null, awayScore = null,
                )
            )
        )
    }

    @Test
    fun `syncGameStatuses updates game status and scores from API`() {
        mockRestClientResponse(
            """{"response": [{"fixture": {"id": 1001, "timestamp": 1668960000, "status": {"short": "FT"}}, "league": {"round": "Group Stage - 1"}, "teams": {"home": {"id": 10}, "away": {"id": 20}}, "goals": {"home": 2, "away": 1}}], "errors": []}"""
        )

        val finished = syncService.syncGameStatuses(tournamentApiId, season)

        assertThat(finished).hasSize(1)
        val game = gameRepository.findByApiId(1001)!!
        assertThat(game.status).isEqualTo("finished")

        val gameTeams = gameTeamRepository.findByGameId(game.id)
        assertThat(gameTeams.find { !it.isAway }?.score).isEqualTo(2)
        assertThat(gameTeams.find { it.isAway }?.score).isEqualTo(1)
    }

    @Test
    fun `syncGameStatuses returns empty when no games need update`() {
        // Update game to finished so nothing needs checking
        syncService.syncGames(
            tournamentApiId, season, listOf(
                SyncedGame(
                    apiId = 1001, stage = "Group Stage - 1", phase = GamePhase.GROUP,
                    status = GameStatus.FINISHED,
                    startedAt = Instant.parse("2024-11-20T16:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = 1, awayScore = 0,
                )
            )
        )

        val result = syncService.syncGameStatuses(tournamentApiId, season)

        assertThat(result).isEmpty()
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
package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.PlayerTournamentRepository
import com.goalcast.repository.TeamTournamentRepository
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

class SyncedWinnerAndTopScorerApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var teamTournamentRepository: TeamTournamentRepository

    @Autowired
    lateinit var playerTournamentRepository: PlayerTournamentRepository

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
                    apiId = 2001, stage = "Final", phase = GamePhase.FINAL,
                    status = GameStatus.FINISHED,
                    startedAt = Instant.parse("2022-12-18T15:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = 3, awayScore = 1,
                )
            )
        )
    }

    @Test
    fun `syncWinnerAndTopScorers sets winner and top scorer flags`() {
        val fixtureResponse =
            """{"response": [{"teams": {"home": {"id": 10, "winner": true}, "away": {"id": 20, "winner": false}}}], "errors": []}"""
        val topScorerResponse =
            """{"response": [{"player": {"id": 100}, "statistics": [{"goals": {"total": 5}}]}], "errors": []}"""

        mockRestClientResponses(fixtureResponse, topScorerResponse)

        syncService.syncWinnerAndTopScorers(tournamentApiId, season)

        val winnerTT = teamTournamentRepository.findAll().filter { it.isWinner }
        assertThat(winnerTT).hasSize(1)
        assertThat(winnerTT[0].team.apiId).isEqualTo(10)

        val topScorers = playerTournamentRepository.findAll().filter { it.isTopScorer }
        assertThat(topScorers).hasSize(1)
        assertThat(topScorers[0].player.apiId).isEqualTo(100)
    }

    @Test
    fun `syncWinnerAndTopScorers does nothing when final is not finished`() {
        // Overwrite with a non-finished final
        syncService.syncGames(
            tournamentApiId, season, listOf(
                SyncedGame(
                    apiId = 2001, stage = "Final", phase = GamePhase.FINAL,
                    status = GameStatus.NOT_STARTED,
                    startedAt = Instant.parse("2024-12-18T15:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = null, awayScore = null,
                )
            )
        )

        val winnersBefore = teamTournamentRepository.findAll().count { it.isWinner }
        val topScorersBefore = playerTournamentRepository.findAll().count { it.isTopScorer }

        syncService.syncWinnerAndTopScorers(tournamentApiId, season)

        assertThat(teamTournamentRepository.findAll().count { it.isWinner }).isEqualTo(winnersBefore)
        assertThat(playerTournamentRepository.findAll().count { it.isTopScorer }).isEqualTo(topScorersBefore)
    }

    private fun mockRestClientResponses(vararg bodies: String) {
        val requestHeadersUriSpec = mockk<RestClient.RequestHeadersUriSpec<*>>(relaxed = true)
        val requestHeadersSpec = mockk<RestClient.RequestHeadersSpec<*>>()

        every { apiSportRestClient.get() } returns requestHeadersUriSpec
        every { requestHeadersUriSpec.uri(any<String>(), any<Function<UriBuilder, URI>>()) } returns requestHeadersSpec

        val bodyIterator = bodies.iterator()
        every { requestHeadersSpec.exchange<String>(any()) } answers {
            val body = bodyIterator.next()
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
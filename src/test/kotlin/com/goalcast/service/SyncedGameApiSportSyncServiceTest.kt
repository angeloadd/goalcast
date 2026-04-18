package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.GameRepository
import com.goalcast.repository.GameTeamRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant

class SyncedGameApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var gameRepository: GameRepository

    @Autowired
    lateinit var gameTeamRepository: GameTeamRepository

    private val tournamentApiId = 1
    private val season = 2022

    private val syncedGames = listOf(
        SyncedGame(
            apiId = 1001,
            stage = "Group Stage - 1",
            phase = GamePhase.GROUP,
            status = GameStatus.NOT_STARTED,
            startedAt = Instant.parse("2022-11-20T16:00:00Z"),
            homeTeamApiId = 10,
            awayTeamApiId = 20,
            homeScore = null,
            awayScore = null,
        ),
        SyncedGame(
            apiId = 1002,
            stage = "Group Stage - 1",
            phase = GamePhase.GROUP,
            status = GameStatus.FINISHED,
            startedAt = Instant.parse("2022-11-20T19:00:00Z"),
            homeTeamApiId = 20,
            awayTeamApiId = 10,
            homeScore = 1,
            awayScore = 2,
        ),
    )

    @BeforeEach
    fun setUp() {
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
    }

    @Test
    fun `syncGames creates new games and game teams`() {
        syncService.syncGames(tournamentApiId, season, syncedGames)

        val games = gameRepository.findAll()
        assertThat(games).hasSize(2)

        val game1 = games.first { it.apiId == 1001 }
        assertThat(game1.stage).isEqualTo("Group Stage - 1")
        assertThat(game1.phase).isEqualTo("group")
        assertThat(game1.status).isEqualTo("not_started")
        assertThat(game1.startedAt).isEqualTo(Instant.parse("2022-11-20T16:00:00Z"))

        val game2 = games.first { it.apiId == 1002 }
        assertThat(game2.status).isEqualTo("finished")

        val gameTeams = gameTeamRepository.findAll()
        assertThat(gameTeams).hasSize(4)

        val game1Teams = gameTeamRepository.findByGameId(game1.id)
        assertThat(game1Teams).hasSize(2)
        assertThat(game1Teams.find { !it.isAway }?.team?.apiId).isEqualTo(10)
        assertThat(game1Teams.find { it.isAway }?.team?.apiId).isEqualTo(20)

        val game2Teams = gameTeamRepository.findByGameId(game2.id)
        assertThat(game2Teams.find { !it.isAway }?.score).isEqualTo(1)
        assertThat(game2Teams.find { it.isAway }?.score).isEqualTo(2)
    }

    @Test
    fun `syncGames updates existing games`() {
        syncService.syncGames(tournamentApiId, season, syncedGames)

        val updatedGames = listOf(
            syncedGames[0].copy(status = GameStatus.FINISHED, homeScore = 3, awayScore = 0),
            syncedGames[1],
        )

        syncService.syncGames(tournamentApiId, season, updatedGames)

        val games = gameRepository.findAll()
        assertThat(games).hasSize(2)

        val game1 = games.first { it.apiId == 1001 }
        assertThat(game1.status).isEqualTo("finished")

        val game1Teams = gameTeamRepository.findByGameId(game1.id)
        assertThat(game1Teams.find { !it.isAway }?.score).isEqualTo(3)
        assertThat(game1Teams.find { it.isAway }?.score).isEqualTo(0)
    }
}
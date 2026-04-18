package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.PlayerRepository
import com.goalcast.repository.PlayerTournamentRepository
import com.goalcast.repository.TeamTournamentRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class SyncedPlayerApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var playerRepository: PlayerRepository

    @Autowired
    lateinit var playerTournamentRepository: PlayerTournamentRepository

    @Autowired
    lateinit var teamTournamentRepository: TeamTournamentRepository

    private val tournamentApiId = 1
    private val season = 2022
    private val teamApiId = 10

    private val syncedTournament = SyncedTournament(
        apiId = tournamentApiId,
        name = "World Cup",
        country = "World",
        logo = "https://example.com/logo.png",
        isCup = true,
        season = season,
    )

    private val syncedTeams = listOf(
        SyncedTeam(
            apiId = teamApiId,
            name = "Brazil",
            code = "BRA",
            logo = "https://example.com/brazil.png",
            isNational = true,
        ),
        SyncedTeam(
            apiId = 20,
            name = "Germany",
            code = "GER",
            logo = "https://example.com/germany.png",
            isNational = true,
        ),
    )

    private val syncedPlayers = listOf(
        SyncedPlayer(apiId = 100, displayedName = "Neymar Jr"),
        SyncedPlayer(apiId = 200, displayedName = "Vinicius Jr"),
    )

    @BeforeEach
    fun setUp() {
        syncService.syncTournament(syncedTournament)
        syncService.syncTeamsForTournamentWithApiIdAndSeason(tournamentApiId, season, syncedTeams)
    }

    @Test
    fun `getTeamApiIdsForTournament returns team api ids`() {
        val result = syncService.getTeamApiIdsForTournament(tournamentApiId, season)

        assertThat(result).containsExactlyInAnyOrder(teamApiId, 20)
    }

    @Test
    fun `syncPlayers creates new players and associations`() {
        syncService.syncPlayers(tournamentApiId, season, teamApiId, syncedPlayers)

        val players = playerRepository.findAll()
        assertThat(players).hasSize(2)

        val neymar = players.first { it.apiId == 100 }
        assertThat(neymar.displayedName).isEqualTo("Neymar Jr")
        assertThat(neymar.national?.apiId).isEqualTo(teamApiId)

        val vinicius = players.first { it.apiId == 200 }
        assertThat(vinicius.displayedName).isEqualTo("Vinicius Jr")

        val associations = playerTournamentRepository.findAll()
        assertThat(associations).hasSize(2)
    }

    @Test
    fun `syncPlayers updates existing players`() {
        syncService.syncPlayers(tournamentApiId, season, teamApiId, syncedPlayers)

        val updatedPlayers = listOf(
            SyncedPlayer(apiId = 100, displayedName = "Neymar da Silva Santos Jr"),
            SyncedPlayer(apiId = 200, displayedName = "Vinicius Jose de Oliveira Jr"),
        )

        syncService.syncPlayers(tournamentApiId, season, teamApiId, updatedPlayers)

        val players = playerRepository.findAll()
        assertThat(players).hasSize(2)

        val neymar = players.first { it.apiId == 100 }
        assertThat(neymar.displayedName).isEqualTo("Neymar da Silva Santos Jr")

        val vinicius = players.first { it.apiId == 200 }
        assertThat(vinicius.displayedName).isEqualTo("Vinicius Jose de Oliveira Jr")

        val associations = playerTournamentRepository.findAll()
        assertThat(associations).hasSize(2)
    }

    @Test
    fun `syncPlayers skips when team does not exist`() {
        val countBefore = playerRepository.count()

        syncService.syncPlayers(tournamentApiId, season, 999, syncedPlayers)

        assertThat(playerRepository.count()).isEqualTo(countBefore)
    }
}
package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.TeamRepository
import com.goalcast.repository.TeamTournamentRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class SyncedTeamApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var teamRepository: TeamRepository

    @Autowired
    lateinit var teamTournamentRepository: TeamTournamentRepository

    private val tournamentApiId = 1
    private val season = 2022

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
            apiId = 10,
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

    @BeforeEach
    fun setUp() {
        syncService.syncTournament(syncedTournament)
    }

    @Test
    fun `syncTeams creates new teams and associations`() {
        syncService.syncTeamsForTournamentWithApiIdAndSeason(tournamentApiId, season, syncedTeams)

        val teams = teamRepository.findAll()
        assertThat(teams).hasSize(2)

        val resultTeam = teams.first { it.apiId == 10 }
        assertThat(resultTeam.name).isEqualTo("Brazil")
        assertThat(resultTeam.code).isEqualTo("BRA")
        assertThat(resultTeam.logo).isEqualTo("https://example.com/brazil.png")
        assertThat(resultTeam.isNational).isTrue()

        val resultTeam2 = teams.first { it.apiId == 20 }
        assertThat(resultTeam2.name).isEqualTo("Germany")

        val associations = teamTournamentRepository.findAll()
        assertThat(associations).hasSize(2)
    }

    @Test
    fun `syncTeams updates existing teams`() {
        syncService.syncTeamsForTournamentWithApiIdAndSeason(tournamentApiId, season, syncedTeams)

        val updatedTeams = listOf(
            SyncedTeam(
                apiId = 10,
                name = "Brazil National Team",
                code = "BRA",
                logo = "https://example.com/brazil-new.png",
                isNational = true,
            ),
            SyncedTeam(
                apiId = 20,
                name = "Germany National Team",
                code = "DEU",
                logo = "https://example.com/germany-new.png",
                isNational = true,
            ),
        )

        syncService.syncTeamsForTournamentWithApiIdAndSeason(tournamentApiId, season, updatedTeams)

        val teams = teamRepository.findAll()
        assertThat(teams).hasSize(2)

        val brazil = teams.first { it.apiId == 10 }
        assertThat(brazil.name).isEqualTo("Brazil National Team")
        assertThat(brazil.logo).isEqualTo("https://example.com/brazil-new.png")

        val germany = teams.first { it.apiId == 20 }
        assertThat(germany.name).isEqualTo("Germany National Team")
        assertThat(germany.code).isEqualTo("DEU")

        val associations = teamTournamentRepository.findAll()
        assertThat(associations).hasSize(2)
    }
}

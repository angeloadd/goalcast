package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.TournamentRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class SyncedTournamentApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var tournamentRepository: TournamentRepository

    private val synced = SyncedTournament(
        apiId = 1,
        name = "World Cup",
        country = "World",
        logo = "https://example.com/logo.png",
        isCup = true,
        season = 2022,
    )

    @Test
    fun `syncTournament creates new tournament when none exists`() {
        val result = syncService.syncTournament(synced)

        assertThat(result.id).isGreaterThan(0)
        assertThat(result.name).isEqualTo(synced.name)
        assertThat(result.country).isEqualTo(synced.country)
        assertThat(result.logo).isEqualTo(synced.logo)
        assertThat(result.isCup).isTrue()
        assertThat(result.season).isEqualTo(synced.season)
        assertThat(result.apiId).isEqualTo(synced.apiId)

        val fromDb = tournamentRepository.findByApiIdAndSeason(synced.apiId, synced.season)
        assertThat(fromDb).isNotNull
        assertThat(fromDb!!.name).isEqualTo(synced.name)
    }

    @Test
    fun `syncTournament updates existing tournament`() {
        syncService.syncTournament(synced)

        val newName = "FIFA World Cup"
        val newCountry = "International"
       
        val updated = synced.copy(name = newName, country = newCountry)
        val result = syncService.syncTournament(updated)

        assertThat(result.name).isEqualTo(newName)
        assertThat(result.country).isEqualTo(newCountry)

        val all = tournamentRepository.findAll()
        assertThat(all).hasSize(1)
        assertThat(all[0].name).isEqualTo(newName)
    }
}

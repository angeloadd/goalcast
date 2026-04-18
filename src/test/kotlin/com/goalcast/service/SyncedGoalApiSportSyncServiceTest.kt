package com.goalcast.service

import BaseIntegrationTest
import com.goalcast.apisport.dto.GamePhase
import com.goalcast.apisport.dto.GameStatus
import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedGoal
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.repository.GameGoalRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant

class SyncedGoalApiSportSyncServiceTest : BaseIntegrationTest() {
    @Autowired
    lateinit var syncService: ApiSportSyncService

    @Autowired
    lateinit var gameGoalRepository: GameGoalRepository

    private val tournamentApiId = 1
    private val season = 2022
    private val gameApiId = 1001

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
        syncService.syncPlayers(
            tournamentApiId, season, 10, listOf(
                SyncedPlayer(apiId = 100, displayedName = "Neymar Jr"),
                SyncedPlayer(apiId = 200, displayedName = "Vinicius Jr"),
            )
        )
        syncService.syncGames(
            tournamentApiId, season, listOf(
                SyncedGame(
                    apiId = gameApiId, stage = "Group Stage - 1", phase = GamePhase.GROUP,
                    status = GameStatus.FINISHED,
                    startedAt = Instant.parse("2022-11-20T16:00:00Z"),
                    homeTeamApiId = 10, awayTeamApiId = 20, homeScore = 2, awayScore = 0,
                )
            )
        )
    }

    @Test
    fun `syncGoals creates goals for a game`() {
        val goals = listOf(
            SyncedGoal(playerApiId = 100, scoringTeamApiId = 10, isOwnGoal = false, scoredAt = 23),
            SyncedGoal(playerApiId = 200, scoringTeamApiId = 10, isOwnGoal = false, scoredAt = 67),
        )

        syncService.syncGoals(gameApiId, goals)

        val saved = gameGoalRepository.findAll()
        assertThat(saved).hasSize(2)

        val first = saved.first { it.scoredAt == 23 }
        assertThat(first.player.apiId).isEqualTo(100)
        assertThat(first.team.apiId).isEqualTo(10)
        assertThat(first.isOwnGoal).isFalse()

        val second = saved.first { it.scoredAt == 67 }
        assertThat(second.player.apiId).isEqualTo(200)
    }

    @Test
    fun `syncGoals replaces existing goals`() {
        syncService.syncGoals(
            gameApiId, listOf(
                SyncedGoal(playerApiId = 100, scoringTeamApiId = 10, isOwnGoal = false, scoredAt = 23),
            )
        )
        assertThat(gameGoalRepository.findAll()).hasSize(1)

        syncService.syncGoals(
            gameApiId, listOf(
                SyncedGoal(playerApiId = 200, scoringTeamApiId = 10, isOwnGoal = false, scoredAt = 55),
                SyncedGoal(playerApiId = 100, scoringTeamApiId = 10, isOwnGoal = false, scoredAt = 70),
            )
        )

        val saved = gameGoalRepository.findAll()
        assertThat(saved).hasSize(2)
        assertThat(saved.map { it.scoredAt }).containsExactlyInAnyOrder(55, 70)
    }

    @Test
    fun `syncGoals credits own goal to opposing team`() {
        syncService.syncGoals(
            gameApiId, listOf(
                SyncedGoal(playerApiId = 100, scoringTeamApiId = 10, isOwnGoal = true, scoredAt = 30),
            )
        )

        val saved = gameGoalRepository.findAll()
        assertThat(saved).hasSize(1)
        assertThat(saved[0].isOwnGoal).isTrue()
        assertThat(saved[0].team.apiId).isEqualTo(20)
    }

    @Test
    fun `syncGoals skips when game does not exist`() {
        val countBefore = gameGoalRepository.count()

        syncService.syncGoals(9999, listOf(SyncedGoal(100, 10, false, 10)))

        assertThat(gameGoalRepository.count()).isEqualTo(countBefore)
    }
}
package com.goalcast.service

import com.goalcast.apisport.dto.SyncedGame
import com.goalcast.apisport.dto.SyncedGoal
import com.goalcast.apisport.dto.SyncedPlayer
import com.goalcast.apisport.dto.SyncedTeam
import com.goalcast.apisport.dto.SyncedTournament
import com.goalcast.apisport.service.ApiSportService
import com.goalcast.entity.Game
import com.goalcast.entity.GameGoal
import com.goalcast.entity.GameTeam
import com.goalcast.entity.Player
import com.goalcast.entity.PlayerTournament
import com.goalcast.entity.Team
import com.goalcast.entity.TeamTournament
import com.goalcast.entity.Tournament
import com.goalcast.repository.GameGoalRepository
import com.goalcast.repository.GameRepository
import com.goalcast.repository.GameTeamRepository
import com.goalcast.repository.PlayerRepository
import com.goalcast.repository.PlayerTournamentRepository
import com.goalcast.repository.TeamRepository
import com.goalcast.repository.TeamTournamentRepository
import com.goalcast.repository.TournamentRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class ApiSportSyncService(
    private val apiSportService: ApiSportService,
    private val clock: Clock,
    private val tournamentRepository: TournamentRepository,
    private val teamRepository: TeamRepository,
    private val playerRepository: PlayerRepository,
    private val teamTournamentRepository: TeamTournamentRepository,
    private val playerTournamentRepository: PlayerTournamentRepository,
    private val gameRepository: GameRepository,
    private val gameTeamRepository: GameTeamRepository,
    private val gameGoalRepository: GameGoalRepository,
) {
    private val log = LoggerFactory.getLogger(ApiSportSyncService::class.java)

    @Transactional
    fun syncTournament(synced: SyncedTournament): Tournament {
        val tournament = tournamentRepository.findByApiIdAndSeason(synced.apiId, synced.season)
            ?: Tournament(apiId = synced.apiId, name = synced.name, season = synced.season, country = synced.country)

        tournament.apply {
            name = synced.name
            country = synced.country
            logo = synced.logo
            isCup = synced.isCup
            updatedAt = clock.instant()
        }

        tournamentRepository.save(tournament)

        log.info("Tournament[name={},apiId={},season={}]: synced", synced.name, synced.apiId, synced.season)

        return tournament
    }

    fun getTeamApiIdsForTournament(tournamentApiId: Int, season: Int): List<Int> {
        val tournament = getTournament(tournamentApiId, season)

        return teamTournamentRepository.findByTournamentId(tournament.id).map { it.team.apiId }
    }

    @Transactional
    fun syncTeamsForTournamentWithApiIdAndSeason(tournamentApiId: Int, season: Int, teams: List<SyncedTeam>) {
        val tournament = getTournament(tournamentApiId, season)
        val existingTT =
            teamTournamentRepository.findByTournamentIdWithTeams(tournament.id).associateBy { it.team.apiId }

        teams.associate {
            val team = existingTT[it.apiId]?.team
                ?: Team(apiId = it.apiId, name = it.name)
            team.apply {
                name = it.name
                code = it.code
                logo = it.logo
                isNational = it.isNational
                updatedAt = clock.instant()
            }

            val tt = existingTT[it.apiId] ?: TeamTournament(team = team, tournament = tournament)

            tt to team
        }.run {
            teamRepository.saveAll(values)
            teamTournamentRepository.saveAll(keys)
            log.info("Synced {} teams", teams.size)
        }
    }

    @Transactional
    fun syncPlayers(tournamentApiId: Int, season: Int, teamApiId: Int, players: List<SyncedPlayer>) {
        val tournament = getTournament(tournamentApiId, season)
        val team = teamRepository.findByApiId(teamApiId)
        if (team == null) {
            log.info("No Team[apiId={}] found for Tournament[apiId={}]", teamApiId, tournamentApiId)

            return
        }
        val existingPT =
            playerTournamentRepository.findByTournamentIdWithPlayers(tournament.id).associateBy { it.player.apiId }

        players.associate { synced ->
            val player = existingPT[synced.apiId]?.player
                ?: Player(apiId = synced.apiId, displayedName = synced.displayedName)
            player.apply {
                displayedName = synced.displayedName
                national = team
                updatedAt = clock.instant()
            }

            val pt = existingPT[synced.apiId] ?: PlayerTournament(player = player, tournament = tournament)

            pt to player
        }.run {
            playerRepository.saveAll(values)
            playerTournamentRepository.saveAll(keys)
            log.info("Synced {} players for Team[apiId={}]", players.size, teamApiId)
        }
    }

    @Transactional
    fun syncGames(tournamentApiId: Int, season: Int, games: List<SyncedGame>) {
        val tournament = getTournament(tournamentApiId, season)
        val existingGames = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id).associateBy { it.apiId }
        val existingTeams = teamRepository.findAll().associateBy { it.apiId }
        val existingGameTeams = gameTeamRepository.findAll().groupBy { it.game.id }

        val gamesToSave = mutableListOf<Game>()
        val gameTeamsToSave = mutableListOf<GameTeam>()
        var hasNewGames = false

        for (synced in games) {
            val isNew = synced.apiId !in existingGames
            if (isNew) hasNewGames = true

            val game = existingGames[synced.apiId]
                ?: Game(
                    apiId = synced.apiId,
                    tournament = tournament,
                    stage = synced.stage,
                    phase = synced.phase.dbValue,
                    startedAt = synced.startedAt
                )
            game.stage = synced.stage
            game.phase = synced.phase.dbValue
            game.status = synced.status.dbValue
            game.startedAt = synced.startedAt
            game.updatedAt = clock.instant()
            gamesToSave.add(game)
        }

        gameRepository.saveAll(gamesToSave)

        // Second pass for game teams (needs game IDs from save)
        for (synced in games) {
            val game = gamesToSave.find { it.apiId == synced.apiId } ?: continue
            val existingGT = existingGameTeams[game.id] ?: emptyList()
            val homeTeam = existingTeams[synced.homeTeamApiId] ?: continue
            val awayTeam = existingTeams[synced.awayTeamApiId] ?: continue

            val existingHome = existingGT.find { it.team.id == homeTeam.id }
            val existingAway = existingGT.find { it.team.id == awayTeam.id }

            if (existingHome != null) {
                existingHome.score = synced.homeScore
                gameTeamsToSave.add(existingHome)
            } else {
                gameTeamsToSave.add(GameTeam(game = game, team = homeTeam, isAway = false, score = synced.homeScore))
            }

            if (existingAway != null) {
                existingAway.score = synced.awayScore
                gameTeamsToSave.add(existingAway)
            } else {
                gameTeamsToSave.add(GameTeam(game = game, team = awayTeam, isAway = true, score = synced.awayScore))
            }
        }

        gameTeamRepository.saveAll(gameTeamsToSave)
        log.info("Synced {} games", games.size)

        if (hasNewGames) updateTournamentDates(tournament)
    }

    @Transactional
    fun syncGoals(gameApiId: Int, goals: List<SyncedGoal>) {
        val game = gameRepository.findByApiId(gameApiId) ?: return
        gameGoalRepository.deleteByGameId(game.id)

        val gameTeams = gameTeamRepository.findByGameId(game.id)
        val homeTeam = gameTeams.find { !it.isAway }?.team
        val awayTeam = gameTeams.find { it.isAway }?.team
        val allPlayers = playerRepository.findAll().associateBy { it.apiId }

        val goalsToSave = goals.mapNotNull { synced ->
            val player = allPlayers[synced.playerApiId] ?: return@mapNotNull null
            val creditedTeam = if (synced.isOwnGoal) {
                if (synced.scoringTeamApiId == homeTeam?.apiId) awayTeam else homeTeam
            } else {
                if (synced.scoringTeamApiId == homeTeam?.apiId) homeTeam else awayTeam
            }
            creditedTeam?.let {
                GameGoal(
                    game = game,
                    player = player,
                    team = it,
                    isOwnGoal = synced.isOwnGoal,
                    scoredAt = synced.scoredAt
                )
            }
        }

        gameGoalRepository.saveAll(goalsToSave)
        log.info("Synced {} goals for game apiId={}", goalsToSave.size, gameApiId)
    }

    @Transactional
    fun syncGameStatuses(tournamentApiId: Int, season: Int): List<Game> {
        val now = clock.instant()
        val shouldHaveStarted = gameRepository.findByStatusAndStartedAtBefore("not_started", now)
        val ongoing = gameRepository.findByStatus("ongoing")
        val gamesToCheck = shouldHaveStarted + ongoing

        if (gamesToCheck.isEmpty()) {
            log.info("No games need status update")
            return emptyList()
        }

        log.info("Checking status for {} games", gamesToCheck.size)

        val allGames = apiSportService.getGames(tournamentApiId, season)
        val apiIdToGame = allGames.associateBy { it.apiId }

        val newlyFinished = mutableListOf<Game>()

        for (game in gamesToCheck) {
            val apiId = game.apiId ?: continue
            val synced = apiIdToGame[apiId] ?: continue
            val newStatus = synced.status.dbValue

            if (game.status != newStatus) {
                val oldStatus = game.status
                game.status = newStatus
                game.updatedAt = clock.instant()
                gameRepository.save(game)
                log.info("Game {} (apiId={}) status: {} -> {}", game.id, apiId, oldStatus, newStatus)

                val gameTeams = gameTeamRepository.findByGameId(game.id)
                val home = gameTeams.find { !it.isAway }
                val away = gameTeams.find { it.isAway }
                if (home != null && synced.homeScore != null) {
                    home.score = synced.homeScore; gameTeamRepository.save(home)
                }
                if (away != null && synced.awayScore != null) {
                    away.score = synced.awayScore; gameTeamRepository.save(away)
                }

                if (newStatus == "finished") newlyFinished.add(game)
            }
        }

        return newlyFinished
    }

    @Transactional
    fun syncMissingGoals(tournamentApiId: Int, season: Int) {
        val cutoff = clock.instant().minusSeconds(24 * 3600)
        val tournament = getTournament(tournamentApiId, season)
        val finishedGames = gameRepository.findByStatusAndTournamentId("finished", tournament.id)
            .filter { it.updatedAt.isAfter(cutoff) }

        for (game in finishedGames) {
            val gameTeams = gameTeamRepository.findByGameId(game.id)
            val homeScore = gameTeams.find { !it.isAway }?.score ?: 0
            val awayScore = gameTeams.find { it.isAway }?.score ?: 0
            val expectedGoals = homeScore + awayScore
            val actualGoals = gameGoalRepository.countByGameId(game.id)

            if (actualGoals.toInt() != expectedGoals) {
                val apiId = game.apiId ?: continue
                log.info("Game {} (apiId={}) has {}/{} goals, re-syncing", game.id, apiId, actualGoals, expectedGoals)
                val goals = apiSportService.getGoals(apiId)
                syncGoals(apiId, goals)
            }
        }
    }

    @Transactional
    fun syncWinnerAndTopScorers(tournamentApiId: Int, season: Int) {
        val tournament = getTournament(tournamentApiId, season)

        val finalGame = gameRepository.findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournament.id, "final")
        if (finalGame == null || !finalGame.isFinished()) return

        val apiId = finalGame.apiId ?: return

        // Sync winner — use API's winner flag (handles penalty shootouts correctly)
        val winnerTeamApiId = apiSportService.getFixtureWinnerTeamApiId(apiId)
        if (winnerTeamApiId != null) {
            val winnerTeam = teamRepository.findByApiId(winnerTeamApiId)
            if (winnerTeam != null) {
                val tt = teamTournamentRepository.findByTeamIdAndTournamentId(winnerTeam.id, tournament.id)
                if (tt != null && !tt.isWinner) {
                    tt.isWinner = true
                    teamTournamentRepository.save(tt)
                    log.info("Tournament winner: {}", winnerTeam.name)
                }
            }
        }

        // Sync top scorers
        val topScorers = apiSportService.getTopScorers(tournamentApiId, season)
        for (synced in topScorers) {
            val player = playerRepository.findByApiId(synced.playerApiId) ?: continue
            val pt = playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) ?: continue
            pt.isTopScorer = true
            playerTournamentRepository.save(pt)
        }
        log.info("Synced {} top scorers", topScorers.size)
    }

    private fun updateTournamentDates(tournament: Tournament) {
        val firstGame = gameRepository.findFirstByTournamentIdOrderByStartedAtAsc(tournament.id)
        val finalGame = gameRepository.findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournament.id, "final")
        if (firstGame != null) tournament.startedAt = firstGame.startedAt
        if (finalGame != null) tournament.finalStartedAt = finalGame.startedAt
        tournament.updatedAt = clock.instant()
        tournamentRepository.save(tournament)
    }

    private fun getTournament(id: Int, season: Int): Tournament {
        return requireNotNull(tournamentRepository.findByApiIdAndSeason(id, season)) {
            "Tournament not synced yet. Run syncTournament() first."
        }
    }
}

package com.goalcast.service

import com.goalcast.apisport.client.ApiSportClient
import com.goalcast.apisport.dto.SyncedTournament
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
import java.time.Instant

@Service
class ApiSportSyncService(
    private val client: ApiSportClient,
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

    companion object {
        const val LEAGUE_ID = 1
        const val SEASON = 2026
    }

    @Transactional
    fun syncTournament(syncedTournament: SyncedTournament): Tournament {
        val tournament = tournamentRepository.findByApiId(syncedTournament.apiId)
            ?: Tournament(
                apiId = syncedTournament.apiId, name = syncedTournament.name,
                season = syncedTournament.season,
                country = syncedTournament.country,
            )

        tournament.apply {
            name = syncedTournament.name
            country = syncedTournament.country
            logo = syncedTournament.logo
            isCup = syncedTournament.isCup
            updatedAt = Instant.now()
        }
        tournamentRepository.save(tournament)
        log.info(
            "Tournament[name={},id={},season={}]: synced successfully",
            syncedTournament.name,
            syncedTournament.apiId,
            syncedTournament.season
        )
        return tournament
    }

    private fun getTournament(): Tournament {
        return requireNotNull(tournamentRepository.findByApiId(LEAGUE_ID)) {
            "Tournament not synced yet. Run syncTournament() first."
        }
    }

    @Transactional
    fun syncTeams() {
        val results = client.get("teams", leagueSeasonParams())
        val tournament = getTournament()

        for (node in results) {
            val t = node.path("team")
            val apiId = t.path("id").asInt()
            val team = teamRepository.findByApiId(apiId)
                ?: Team(apiId = apiId, name = t.path("name").asString())
            team.name = t.path("name").asString()
            team.code = t.path("code").asString(null)
            team.logo = t.path("logo").asString(null)
            team.isNational = t.path("national").asBoolean(false)
            team.updatedAt = Instant.now()
            teamRepository.save(team)

            if (teamTournamentRepository.findByTeamIdAndTournamentId(team.id, tournament.id) == null) {
                teamTournamentRepository.save(TeamTournament(team = team, tournament = tournament))
            }
        }
        log.info("Synced {} teams", results.size)
    }

    @Transactional
    fun syncPlayers() {
        val tournament = getTournament()
        val teamTournaments = teamTournamentRepository.findByTournamentId(tournament.id)

        for (tt in teamTournaments) {
            val results = client.get("players/squads", mapOf("team" to tt.team.apiId.toString()))
            if (results.isEmpty()) continue

            val playersNode = results[0].path("players")
            for (p in playersNode) {
                val apiId = p.path("id").asInt()
                val player = playerRepository.findByApiId(apiId)
                    ?: Player(apiId = apiId, displayedName = p.path("name").asString())
                player.displayedName = p.path("name").asString()
                player.national = tt.team
                player.updatedAt = Instant.now()
                playerRepository.save(player)

                if (playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) == null) {
                    playerTournamentRepository.save(PlayerTournament(player = player, tournament = tournament))
                }
            }
            log.info("Synced players for team {}", tt.team.name)
        }
    }

    @Transactional
    fun syncGames() {
        val tournament = getTournament()
        val results = client.get("fixtures", leagueSeasonParams())

        for (node in results) {
            val fixture = node.path("fixture")
            val apiId = fixture.path("id").asInt()
            val startedAt = Instant.ofEpochSecond(fixture.path("timestamp").asLong())
            val round = node.path("league").path("round").asString()
            val phase = mapRoundToPhase(round)
            val statusShort = fixture.path("status").path("short").asString()

            val game = gameRepository.findByApiId(apiId)
                ?: Game(apiId = apiId, tournament = tournament, stage = round, phase = phase, startedAt = startedAt)
            game.stage = round
            game.phase = phase
            game.status = mapApiStatus(statusShort)
            game.startedAt = startedAt
            game.updatedAt = Instant.now()
            gameRepository.save(game)

            val homeTeamApiId = node.path("teams").path("home").path("id").asInt()
            val awayTeamApiId = node.path("teams").path("away").path("id").asInt()
            val homeScore = node.path("goals").path("home").let { if (it.isNull) null else it.asInt() }
            val awayScore = node.path("goals").path("away").let { if (it.isNull) null else it.asInt() }

            upsertGameTeam(game, homeTeamApiId, isAway = false, score = homeScore)
            upsertGameTeam(game, awayTeamApiId, isAway = true, score = awayScore)
        }
        log.info("Synced {} games", results.size)
        updateTournamentDates(tournament)
    }

    @Transactional
    fun syncGoals(gameApiId: Int) {
        val game = gameRepository.findByApiId(gameApiId) ?: return
        val results = client.get("fixtures/events", mapOf("fixture" to gameApiId.toString(), "type" to "Goal"))

        gameGoalRepository.deleteByGameId(game.id)

        val gameTeams = gameTeamRepository.findByGameId(game.id)
        val homeTeam = gameTeams.find { !it.isAway }?.team
        val awayTeam = gameTeams.find { it.isAway }?.team

        for (node in results) {
            val detail = node.path("detail").asString()
            if (detail.contains("Missed")) continue

            val time = node.path("time")
            val elapsed = time.path("elapsed").asInt()
            val extra = if (time.path("extra").isNull) 0 else time.path("extra").asInt()
            val comment = node.path("comments").asString("")

            if (elapsed == 120 && extra > 0 && comment.contains("Penalty", ignoreCase = true)) continue

            val playerApiId = node.path("player").path("id").asInt()
            val player = playerRepository.findByApiId(playerApiId) ?: continue
            val isOwnGoal = detail.contains("Own", ignoreCase = true)

            val scoringTeamApiId = node.path("team").path("id").asInt()
            val creditedTeam = if (isOwnGoal) {
                if (scoringTeamApiId == homeTeam?.apiId) awayTeam else homeTeam
            } else {
                if (scoringTeamApiId == homeTeam?.apiId) homeTeam else awayTeam
            }

            if (creditedTeam != null) {
                gameGoalRepository.save(
                    GameGoal(
                        game = game,
                        player = player,
                        team = creditedTeam,
                        isOwnGoal = isOwnGoal,
                        scoredAt = elapsed + extra
                    )
                )
            }
        }
        log.info("Synced goals for game apiId={}", gameApiId)
    }

    /**
     * Checks for games that need a status update:
     * - not_started games with started_at in the past → should be ongoing or finished
     * - ongoing games → might have finished
     *
     * If any such games exist, makes ONE call to the fixtures endpoint and updates
     * all matching games from the response.
     *
     * Returns the list of games whose status changed to "finished" (for goal sync).
     */
    @Transactional
    fun syncGameStatuses(): List<Game> {
        val now = Instant.now()
        val shouldHaveStarted = gameRepository.findByStatusAndStartedAtBefore("not_started", now)
        val ongoing = gameRepository.findByStatus("ongoing")
        val gamesToCheck = shouldHaveStarted + ongoing

        if (gamesToCheck.isEmpty()) {
            log.info("No games need status update")
            return emptyList()
        }

        log.info("Checking status for {} games", gamesToCheck.size)

        // One API call to get all fixtures for the league — the response includes current status
        val results = client.get("fixtures", leagueSeasonParams())
        val apiIdToStatus = results.associate { node ->
            val fixtureId = node.path("fixture").path("id").asInt()
            val statusShort = node.path("fixture").path("status").path("short").asString()
            val homeScore = node.path("goals").path("home").let { if (it.isNull) null else it.asInt() }
            val awayScore = node.path("goals").path("away").let { if (it.isNull) null else it.asInt() }
            fixtureId to Triple(mapApiStatus(statusShort), homeScore, awayScore)
        }

        val newlyFinished = mutableListOf<Game>()

        for (game in gamesToCheck) {
            val apiId = game.apiId ?: continue
            val (newStatus, homeScore, awayScore) = apiIdToStatus[apiId] ?: continue

            val oldStatus = game.status
            if (oldStatus != newStatus) {
                game.status = newStatus
                game.updatedAt = Instant.now()
                gameRepository.save(game)
                log.info("Game {} (apiId={}) status: {} → {}", game.id, apiId, oldStatus, newStatus)

                // Update scores
                val gameTeams = gameTeamRepository.findByGameId(game.id)
                val home = gameTeams.find { !it.isAway }
                val away = gameTeams.find { it.isAway }
                if (home != null && homeScore != null) {
                    home.score = homeScore; gameTeamRepository.save(home)
                }
                if (away != null && awayScore != null) {
                    away.score = awayScore; gameTeamRepository.save(away)
                }

                if (newStatus == "finished") {
                    newlyFinished.add(game)
                }
            }
        }

        return newlyFinished
    }

    /**
     * Checks finished games for missing goals. A game's goal count should match
     * home_score + away_score. If it doesn't, re-syncs goals for that game.
     * Only checks games finished in the last 24 hours to avoid unnecessary work.
     */
    @Transactional
    fun syncMissingGoals() {
        val cutoff = Instant.now().minusSeconds(24 * 3600)
        val tournament = getTournament()
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
                syncGoals(apiId)
            }
        }
    }

    @Transactional
    fun syncTopScorers() {
        val tournament = getTournament()
        val results = client.get("players/topscorers", leagueSeasonParams())
        if (results.isEmpty()) return

        val topScorerGoals = results[0].path("statistics")[0].path("goals").path("total").asInt()

        for (node in results) {
            val goals = node.path("statistics")[0].path("goals").path("total").asInt()
            if (goals < topScorerGoals) break

            val playerApiId = node.path("player").path("id").asInt()
            val player = playerRepository.findByApiId(playerApiId) ?: continue
            val pt = playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) ?: continue
            pt.isTopScorer = true
            playerTournamentRepository.save(pt)
        }
        log.info("Synced top scorers")
    }

    @Transactional
    fun syncWinner() {
        val tournament = getTournament()
        val finalGames = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
            .filter { it.isFinal() && it.isFinished() }
        if (finalGames.isEmpty()) return

        val finalGame = finalGames.last()
        val gameTeams = gameTeamRepository.findByGameId(finalGame.id)
        val winner = gameTeams.maxByOrNull { it.score ?: 0 }?.team ?: return

        val tt = teamTournamentRepository.findByTeamIdAndTournamentId(winner.id, tournament.id) ?: return
        tt.isWinner = true
        teamTournamentRepository.save(tt)
        log.info("Tournament winner: {}", winner.name)
    }

    private fun upsertGameTeam(game: Game, teamApiId: Int, isAway: Boolean, score: Int?) {
        val team = teamRepository.findByApiId(teamApiId) ?: return
        val existing = gameTeamRepository.findByGameId(game.id).find { it.team.id == team.id }
        if (existing != null) {
            existing.score = score
            gameTeamRepository.save(existing)
        } else {
            gameTeamRepository.save(GameTeam(game = game, team = team, isAway = isAway, score = score))
        }
    }

    private fun updateTournamentDates(tournament: Tournament) {
        val games = gameRepository.findByTournamentIdOrderByStartedAt(tournament.id)
        if (games.isEmpty()) return
        tournament.startedAt = games.first().startedAt
        val finalGame = games.firstOrNull { it.isFinal() }
        if (finalGame != null) tournament.finalStartedAt = finalGame.startedAt
        tournament.updatedAt = Instant.now()
        tournamentRepository.save(tournament)
    }

    private fun leagueSeasonParams() = mapOf("league" to LEAGUE_ID.toString(), "season" to SEASON.toString())

    fun mapRoundToPhase(round: String): String {
        val lower = round.lowercase()
        return when {
            lower.contains("group") -> "group"
            lower.contains("32") -> "round_of_32"
            lower.contains("16") -> "round_of_16"
            lower.contains("quarter") -> "quarter"
            lower.contains("semi") -> "semi"
            lower.contains("final") && !lower.contains("semi") -> "final"
            else -> "group"
        }
    }

    fun mapApiStatus(short: String): String = when (short) {
        "FT", "AET", "PEN" -> "finished"
        "1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE" -> "ongoing"
        else -> "not_started"
    }
}

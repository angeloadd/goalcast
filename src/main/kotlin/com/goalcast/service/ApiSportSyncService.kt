package com.goalcast.service

import com.goalcast.client.ApiSportClient
import com.goalcast.config.ApiSportProperties
import com.goalcast.entity.*
import com.goalcast.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class ApiSportSyncService(
    private val client: ApiSportClient,
    private val props: ApiSportProperties,
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
    fun syncTeams() {
        val results = client.get("teams", leagueSeasonParams())
        val tournament = getOrCreateTournament()

        for (node in results) {
            val t = node.path("team")
            val apiId = t.path("id").asInt()
            val team = teamRepository.findByApiId(apiId)
                ?: Team(apiId = apiId, name = t.path("name").asText())
            team.name = t.path("name").asText()
            team.code = t.path("code").asText(null)
            team.logo = t.path("logo").asText(null)
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
        val tournament = getOrCreateTournament()
        val teamTournaments = teamTournamentRepository.findByTournamentId(tournament.id)

        for (tt in teamTournaments) {
            val results = client.get("players/squads", mapOf("team" to tt.team.apiId.toString()))
            if (results.isEmpty()) continue

            val playersNode = results[0].path("players")
            for (p in playersNode) {
                val apiId = p.path("id").asInt()
                val player = playerRepository.findByApiId(apiId)
                    ?: Player(apiId = apiId, displayedName = p.path("name").asText())
                player.displayedName = p.path("name").asText()
                player.national = tt.team
                player.updatedAt = Instant.now()
                playerRepository.save(player)

                if (playerTournamentRepository.findByPlayerIdAndTournamentId(player.id, tournament.id) == null) {
                    playerTournamentRepository.save(PlayerTournament(player = player, tournament = tournament))
                }
            }
            log.info("Synced players for team {}", tt.team.name)
            Thread.sleep(6000) // ApiSport rate limit: ~10 req/min
        }
    }

    @Transactional
    fun syncGames() {
        val tournament = getOrCreateTournament()
        val results = client.get("fixtures", leagueSeasonParams())

        for (node in results) {
            val fixture = node.path("fixture")
            val apiId = fixture.path("id").asInt()
            val startedAt = Instant.ofEpochSecond(fixture.path("timestamp").asLong())
            val round = node.path("league").path("round").asText()
            val phase = mapRoundToPhase(round)
            val statusShort = fixture.path("status").path("short").asText()

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
            val detail = node.path("detail").asText()
            if (detail.contains("Missed")) continue

            val time = node.path("time")
            val elapsed = time.path("elapsed").asInt()
            val extra = if (time.path("extra").isNull) 0 else time.path("extra").asInt()
            val comment = node.path("comments").asText("")

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
                    GameGoal(game = game, player = player, team = creditedTeam, isOwnGoal = isOwnGoal, scoredAt = elapsed + extra)
                )
            }
        }
        log.info("Synced goals for game apiId={}", gameApiId)
    }

    @Transactional
    fun syncAllGoalsForLiveGames() {
        val tournament = getOrCreateTournament()
        val liveGames = gameRepository.findByStatusAndTournamentId("ongoing", tournament.id)
        val finishedRecently = gameRepository.findByStatusAndTournamentId("finished", tournament.id)

        for (game in liveGames + finishedRecently) {
            val apiId = game.apiId ?: continue
            syncGoals(apiId)
        }
    }

    @Transactional
    fun syncTopScorers() {
        val tournament = getOrCreateTournament()
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
        val tournament = getOrCreateTournament()
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

    fun getOrCreateTournament(): Tournament {
        return tournamentRepository.findByApiId(props.leagueId)
            ?: tournamentRepository.save(
                Tournament(apiId = props.leagueId, name = "World Cup ${props.season}", season = props.season, isCup = true)
            )
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
        val firstKnockout = games.firstOrNull { it.isKnockout() }
        if (firstKnockout != null) tournament.finalStartedAt = firstKnockout.startedAt
        tournament.updatedAt = Instant.now()
        tournamentRepository.save(tournament)
    }

    private fun leagueSeasonParams() = mapOf("league" to props.leagueId.toString(), "season" to props.season.toString())

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

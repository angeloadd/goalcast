package com.goalcast.repository

import com.goalcast.entity.Game
import org.springframework.data.jpa.repository.JpaRepository

interface GameRepository : JpaRepository<Game, Long> {
    fun findByApiId(apiId: Int): Game?
    fun findByTournamentIdOrderByStartedAt(tournamentId: Long): List<Game>
    fun findByStatusAndTournamentId(status: String, tournamentId: Long): List<Game>
}

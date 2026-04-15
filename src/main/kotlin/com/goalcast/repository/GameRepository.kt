package com.goalcast.repository

import com.goalcast.entity.Game
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface GameRepository : JpaRepository<Game, Long> {
    fun findByApiId(apiId: Int): Game?
    fun findByTournamentIdOrderByStartedAt(tournamentId: Long): List<Game>
    fun findByStatusAndTournamentId(status: String, tournamentId: Long): List<Game>
    fun findByStatusAndStartedAtBefore(status: String, startedAt: Instant): List<Game>
    fun findByStatus(status: String): List<Game>
    fun findFirstByTournamentIdOrderByStartedAtAsc(tournamentId: Long): Game?
    fun findFirstByTournamentIdAndPhaseOrderByStartedAtAsc(tournamentId: Long, phase: String): Game?
}

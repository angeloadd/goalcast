package com.goalcast.repository

import com.goalcast.entity.PlayerTournament
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerTournamentRepository : JpaRepository<PlayerTournament, Long> {
    fun findByTournamentId(tournamentId: Long): List<PlayerTournament>
    fun findByPlayerIdAndTournamentId(playerId: Long, tournamentId: Long): PlayerTournament?
}

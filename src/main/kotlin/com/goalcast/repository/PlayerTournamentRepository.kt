package com.goalcast.repository

import com.goalcast.entity.PlayerTournament
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PlayerTournamentRepository : JpaRepository<PlayerTournament, Long> {
    fun findByPlayerIdAndTournamentId(playerId: Long, tournamentId: Long): PlayerTournament?

    @Query("SELECT pt FROM PlayerTournament pt JOIN FETCH pt.player WHERE pt.tournament.id = :tournamentId")
    fun findByTournamentIdWithPlayers(tournamentId: Long): List<PlayerTournament>
}

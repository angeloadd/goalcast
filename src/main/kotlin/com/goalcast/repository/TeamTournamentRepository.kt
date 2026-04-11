package com.goalcast.repository

import com.goalcast.entity.TeamTournament
import org.springframework.data.jpa.repository.JpaRepository

interface TeamTournamentRepository : JpaRepository<TeamTournament, Long> {
    fun findByTournamentId(tournamentId: Long): List<TeamTournament>
    fun findByTeamIdAndTournamentId(teamId: Long, tournamentId: Long): TeamTournament?
}

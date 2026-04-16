package com.goalcast.repository

import com.goalcast.entity.TeamTournament
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface TeamTournamentRepository : JpaRepository<TeamTournament, Long> {
    fun findByTournamentId(tournamentId: Long): List<TeamTournament>
    fun findByTeamIdAndTournamentId(teamId: Long, tournamentId: Long): TeamTournament?

    @Query("SELECT tt FROM TeamTournament tt JOIN FETCH tt.team WHERE tt.tournament.id = :tournamentId")
    fun findByTournamentIdWithTeams(tournamentId: Long): List<TeamTournament>
}

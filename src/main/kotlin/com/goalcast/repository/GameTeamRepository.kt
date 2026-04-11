package com.goalcast.repository

import com.goalcast.entity.GameTeam
import org.springframework.data.jpa.repository.JpaRepository

interface GameTeamRepository : JpaRepository<GameTeam, Long> {
    fun findByGameId(gameId: Long): List<GameTeam>
}

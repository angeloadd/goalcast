package com.goalcast.repository

import com.goalcast.entity.GameGoal
import org.springframework.data.jpa.repository.JpaRepository

interface GameGoalRepository : JpaRepository<GameGoal, Long> {
    fun findByGameId(gameId: Long): List<GameGoal>
    fun countByGameId(gameId: Long): Long
    fun deleteByGameId(gameId: Long)
}

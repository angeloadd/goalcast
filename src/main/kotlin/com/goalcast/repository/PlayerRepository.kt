package com.goalcast.repository

import com.goalcast.entity.Player
import org.springframework.data.jpa.repository.JpaRepository

interface PlayerRepository : JpaRepository<Player, Long> {
    fun findByApiId(apiId: Int): Player?
}

package com.goalcast.repository

import com.goalcast.entity.Team
import org.springframework.data.jpa.repository.JpaRepository

interface TeamRepository : JpaRepository<Team, Long> {
    fun findByApiId(apiId: Int): Team?
}

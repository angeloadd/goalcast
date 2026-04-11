package com.goalcast.repository

import com.goalcast.entity.Tournament
import org.springframework.data.jpa.repository.JpaRepository

interface TournamentRepository : JpaRepository<Tournament, Long> {
    fun findByApiId(apiId: Int): Tournament?
}

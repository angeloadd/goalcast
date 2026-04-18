package com.goalcast.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "tournaments")
class Tournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var country: String,

    @Column
    var logo: String? = null,

    @Column(nullable = false)
    var season: Int,

    @Column(name = "is_cup", nullable = false)
    var isCup: Boolean = false,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "final_started_at")
    var finalStartedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

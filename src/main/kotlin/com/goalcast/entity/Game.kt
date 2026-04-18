package com.goalcast.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "games")
class Game(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", unique = true)
    val apiId: Int? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(nullable = false)
    var stage: String,

    @Column(nullable = false)
    var phase: String,

    @Column(nullable = false)
    var status: String = "not_started",

    @Column(name = "started_at", nullable = false)
    var startedAt: Instant,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    fun isKnockout(): Boolean = phase != "group"
    fun isFinal(): Boolean = phase == "final"
    fun isFinished(): Boolean = status == "finished"
    fun hasStarted(): Boolean = status != "not_started"
}

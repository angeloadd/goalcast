package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "teams")
class Team(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(nullable = false)
    var name: String,

    @Column
    var code: String? = null,

    @Column
    var logo: String? = null,

    @Column(name = "is_national", nullable = false)
    var isNational: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

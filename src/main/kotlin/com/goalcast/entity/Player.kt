package com.goalcast.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "players")
class Player(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "api_id", nullable = false, unique = true)
    val apiId: Int,

    @Column(name = "displayed_name", nullable = false)
    var displayedName: String,

    @Column(name = "first_name")
    var firstName: String? = null,

    @Column(name = "last_name")
    var lastName: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    var club: Team? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "national_id")
    var national: Team? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

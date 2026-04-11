package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "player_tournaments", uniqueConstraints = [UniqueConstraint(columnNames = ["player_id", "tournament_id"])])
class PlayerTournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    val player: Player,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(name = "is_top_scorer", nullable = false)
    var isTopScorer: Boolean = false,
)

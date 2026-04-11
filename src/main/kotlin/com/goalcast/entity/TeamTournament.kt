package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "team_tournaments", uniqueConstraints = [UniqueConstraint(columnNames = ["team_id", "tournament_id"])])
class TeamTournament(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    val team: Team,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    val tournament: Tournament,

    @Column(name = "is_winner", nullable = false)
    var isWinner: Boolean = false,
)

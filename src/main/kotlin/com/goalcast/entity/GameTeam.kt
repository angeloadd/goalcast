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
import jakarta.persistence.UniqueConstraint

@Entity
@Table(name = "game_teams", uniqueConstraints = [UniqueConstraint(columnNames = ["game_id", "team_id"])])
class GameTeam(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "game_id", nullable = false) val game: Game,
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "team_id", nullable = false) val team: Team,
    @Column(name = "is_away", nullable = false) val isAway: Boolean = false,
    @Column var score: Int? = null,
)

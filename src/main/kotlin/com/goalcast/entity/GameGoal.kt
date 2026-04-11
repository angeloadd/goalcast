package com.goalcast.entity

import jakarta.persistence.*

@Entity
@Table(name = "game_goals")
class GameGoal(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "game_id", nullable = false) val game: Game,
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "player_id", nullable = false) val player: Player,
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "team_id", nullable = false) val team: Team,
    @Column(name = "is_own_goal", nullable = false) val isOwnGoal: Boolean = false,
    @Column(name = "scored_at") val scoredAt: Int? = null,
)

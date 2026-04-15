package com.goalcast.apisport.dto

enum class GameStatus(val dbValue: String) {
    NOT_STARTED("not_started"),
    ONGOING("ongoing"),
    FINISHED("finished");
}

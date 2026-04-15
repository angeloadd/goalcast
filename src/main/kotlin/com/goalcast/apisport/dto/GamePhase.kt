package com.goalcast.apisport.dto

enum class GamePhase(val dbValue: String) {
    GROUP("group"),
    ROUND_OF_32("round_of_32"),
    ROUND_OF_16("round_of_16"),
    QUARTER("quarter"),
    SEMI("semi"),
    FINAL("final");
}

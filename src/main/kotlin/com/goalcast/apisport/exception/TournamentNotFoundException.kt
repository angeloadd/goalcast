package com.goalcast.apisport.exception

class TournamentNotFoundException(val id: Int, val season: Int) :
    RuntimeException("Tournament[id=$id, season=$season] not found in api-sport")

class MissingApiSportPropException(prop: String, id: Int, season: Int) :
    RuntimeException("Tournament[id=$id, season=$season]: missing $prop from api-sport response")

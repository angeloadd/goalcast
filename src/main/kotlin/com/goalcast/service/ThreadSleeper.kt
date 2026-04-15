package com.goalcast.service

import org.springframework.stereotype.Component

@Component
class ThreadSleeper : Sleeper {
    override fun sleep(millis: Long) = Thread.sleep(millis)
}

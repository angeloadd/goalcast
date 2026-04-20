package com.goalcast.service

import org.springframework.stereotype.Component

@Component
class ThreadSleepService : SleepInterface {
    override fun sleep(millis: Long) = Thread.sleep(millis)
}

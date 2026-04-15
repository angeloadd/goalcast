package com.goalcast.apisport.client

import com.goalcast.service.Sleeper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Duration
import java.time.Instant

@Component
class RateLimiter(private val clock: Clock, private val sleeper: Sleeper) {
    companion object {
        private val log = LoggerFactory.getLogger(RateLimiter::class.java)
    }

    private var waitUntil: Instant = Instant.EPOCH

    fun waitIfNeeded() {
        val now = clock.instant()
        if (now.isBefore(waitUntil)) {
            val waitMs = Duration.between(now, waitUntil).toMillis()
            log.info("Rate limit cooldown, waiting {}ms", waitMs)
            sleeper.sleep(waitMs)
        }
    }

    fun update(remaining: Int?) {
        if (remaining != null && remaining <= 0) {
            log.info("Rate limit nearly exhausted (remaining={}), next request will wait", remaining)
            waitUntil = clock.instant().plusSeconds(60)
        }
    }
}

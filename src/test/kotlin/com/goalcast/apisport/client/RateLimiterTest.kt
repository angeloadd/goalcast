package com.goalcast.apisport.client

import BaseUnitTest
import com.goalcast.service.Sleeper
import io.mockk.every
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource
import java.time.Clock
import java.time.Instant

class RateLimiterTest : BaseUnitTest() {
    @InjectMockKs
    lateinit var rateLimiter: RateLimiter

    @MockK
    lateinit var clock: Clock

    @MockK(relaxUnitFun = true)
    lateinit var sleeper: Sleeper

    @Test
    fun `waitIfNeeded calls sleeper if waitUntil is in the future`() {
        every { clock.instant() } returns Instant.EPOCH.minusSeconds(1)
        rateLimiter.waitIfNeeded()

        verify(exactly = 1) { sleeper.sleep(1_000) }
    }

    @Test
    fun `waitIfNeeded does not call sleeper if waitUntil is in the past`() {
        every { clock.instant() } returns Instant.EPOCH.plusSeconds(1)
        rateLimiter.waitIfNeeded()
        verify(exactly = 0) { sleeper.sleep(any()) }
    }

    @Test
    fun `update updates waitUntil if not enough calls left`() {
        every { clock.instant() } returns mockk {
            every { plusSeconds(60) } returns mockk<Instant>()
        }

        rateLimiter.update(0)
        verify(exactly = 1) { clock.instant() }
    }

    @ParameterizedTest
    @CsvSource(value = ["null", "1"], nullValues = ["null"])
    fun `update should do nothing if enough calls left or null rate limit remaining`(remaining: Int?) {
        rateLimiter.update(remaining)
        verify(exactly = 0) { clock.instant() }
    }
}

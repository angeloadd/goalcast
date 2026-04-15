# Unit Testing Guide

How to write unit tests in this project. Integration testing covered separately.

## Stack

- **JUnit 5** — test framework
- **MockK** — mocking (Kotlin-native, replaces Mockito)
- **AssertJ** — assertions (`assertThat`)
- **Vitest** — Angular frontend (not covered here)

Run all tests: `./mvnw test`
Run one class: `./mvnw test -Dtest=ApiSportClientTest`

## Base Class

Every unit test extends `BaseUnitTest`:

```kotlin
@ExtendWith(MockKExtension::class)
@MockKExtension.CheckUnnecessaryStub
open class BaseUnitTest
```

This gives you:
- `@MockK` / `@InjectMockKs` annotation support
- Unnecessary stub detection — fails if a mock is configured but never called

## Test Structure

### Services with dependencies — use `@InjectMockKs`

When the class under test has constructor dependencies, let MockK inject them:

```kotlin
class ApiSportServiceTest : BaseUnitTest() {
    @InjectMockKs
    lateinit var apiSportService: ApiSportService

    @MockK
    lateinit var apiSportClient: ApiSportClient

    @MockK
    lateinit var mapper: ApiSportMapper
}
```

`@InjectMockKs` creates the real instance with mocked dependencies. Field names must match constructor parameter names.

### Pure logic classes — instantiate directly

When the class has no dependencies or only simple ones, create it directly:

```kotlin
class SyncedTournamentApiSportMapperTest : BaseUnitTest() {
    private val mapper = ApiSportMapper()
    private val objectMapper = ObjectMapper()
}
```

No mocking needed. Use real `ObjectMapper` for JSON parsing in mapper tests.

### Relaxed mocks

Use `relaxUnitFun = true` for mocks whose `Unit`-returning functions you don't need to verify:

```kotlin
@MockK(relaxUnitFun = true)
lateinit var rateLimiter: RateLimiter
```

This avoids having to stub every `Unit` function. Only use when the mock's behavior isn't part of the test's assertions.

## Naming

Test methods use backtick syntax describing the behavior:

```kotlin
@Test
fun `getTournament throws when api returns empty list`() { }
```

Test file naming: `{Feature}{ClassUnderTest}Test.kt`. When a class has many responsibilities to test (e.g., `ApiSportMapper` mapping different DTOs), split into focused files:

- `SyncedTournamentApiSportMapperTest.kt` — tournament mapping tests
- `SyncedTeamApiSportMapperTest.kt` — team mapping tests (future)

This keeps test files small while the class under test can grow.

## Assertions

Use AssertJ, not JUnit assertions:

```kotlin
// Good
assertThat(result.name).isEqualTo("World Cup")
assertThat(result.isCup).isTrue()
assertThat(result).isEqualTo(expected)

// Avoid
assertEquals("World Cup", result.name)  // JUnit — less readable
```

For exceptions, use JUnit's `assertThrows`:

```kotlin
assertThrows<TournamentNotFoundException> {
    apiSportService.getTournament(1, 2026)
}
```

Don't assert on exception messages unless the message content is part of the contract. Assert on the exception type only.

## Verification

Use `verify` to assert that a dependency was called (or not called):

```kotlin
verify(exactly = 1) { mapper.mapToSyncedTournament(first, 1, 2026) }
verify(exactly = 0) { mapper.mapToSyncedTournament(second, any(), any()) }
```

Only verify interactions that are meaningful to the test. Don't verify every mock call — that makes tests brittle. Prefer asserting on the return value when possible.

## Parameterized Tests

Use parameterized tests to collapse similar test cases into one method. Prefer this over repeating similar test bodies.

### `@CsvSource` — simple value pairs

```kotlin
@ParameterizedTest
@CsvSource("Cup, true", "CUP, true", "cup, true", "League, false")
fun `isCup is case insensitive`(type: String, expected: Boolean) {
    // ...
}
```

### `@CsvSource` with nulls

```kotlin
@ParameterizedTest
@CsvSource(value = ["3", "null"], nullValues = ["null"])
fun `update handles null and non-null remaining`(remaining: Int?) {
    // ...
}
```

### `@ValueSource` — single parameter

```kotlin
@ParameterizedTest
@ValueSource(strings = ["name", "type", "logo"])
fun `throws when league field is missing`(field: String) {
    // ...
}
```

### `@MethodSource` — complex test data

When test data involves strings with special characters (quotes, commas) that break `@CsvSource`, use `@MethodSource`:

```kotlin
@ParameterizedTest(name = "{0}")
@MethodSource("missingOrBlankFields")
@Suppress("UNUSED_PARAMETER")
fun `throws when required field is missing or blank`(description: String, search: String, replace: String) {
    val json = validJson.replace(search, replace)
    assertThrows<MissingApiSportPropException> {
        mapper.mapToSyncedTournament(parse(json), 1, 2026)
    }
}

companion object {
    @JvmStatic
    fun missingOrBlankFields(): Stream<Arguments> = Stream.of(
        Arguments.of("missing name", """"name":""", """"_name":"""),
        Arguments.of("blank name", "\"name\": \"World Cup\"", "\"name\": \"\""),
    )
}
```

Notes:
- The `description` parameter is for display only — use `@Suppress("UNUSED_PARAMETER")`
- `(name = "{0}")` shows the description in test output
- Must be in a `companion object` with `@JvmStatic`
- Use raw strings (`"""..."""`) for JSON fragments with quotes, fall back to escaped strings (`"\"...\""`) when the value itself contains empty quotes

## Testing Patterns by Layer

### Client tests (HTTP)

Mock the `RestClient` fluent API. Use a helper to avoid repeating the mock chain:

```kotlin
private fun mockRestClientResponse(body: String?, rateLimitRemaining: String? = "9") {
    // ... set up the RestClient mock chain
    // Return body from exchange, set headers
}
```

Test: successful response parsing, error handling (token errors, missing response), null body, rate limiter interaction.

### Mapper tests (JSON → DTO)

Use real `ObjectMapper` to parse JSON strings. No mocking — mappers are pure functions.

Provide a `validJson` fixture and modify it with `.replace()` for error cases:

```kotlin
private val validJson = """{ "league": { "name": "World Cup", ... } }"""

// Missing field: rename the key
val json = validJson.replace(""""name":""", """"_name":""")

// Blank field: replace value with empty
val json = validJson.replace("\"name\": \"World Cup\"", "\"name\": \"\"")
```

Test: happy path mapping, each field that can be missing or blank, case sensitivity where relevant.

### Service tests (orchestration)

Mock dependencies (`@InjectMockKs` + `@MockK`). Test the flow: what gets called, what gets returned, what exceptions propagate.

```kotlin
@Test
fun `getTournament maps first result and ignores the rest`() {
    val first = mockk<JsonNode>()
    val second = mockk<JsonNode>()
    every { client.get("leagues", any()) } returns listOf(first, second)
    every { mapper.mapToSyncedTournament(first, 1, 2026) } returns expected

    val result = service.getTournament(1, 2026)

    assertThat(result).isEqualTo(expected)
    verify(exactly = 0) { mapper.mapToSyncedTournament(second, any(), any()) }
}
```

### Pure logic tests (e.g., RateLimiter)

Inject `Clock` and `Sleeper` as mockable dependencies. Control time to test time-dependent behavior:

```kotlin
@Test
fun `waitIfNeeded calls sleeper if waitUntil is in the future`() {
    every { clock.instant() } returns Instant.EPOCH.minusSeconds(1)
    rateLimiter.waitIfNeeded()
    verify(exactly = 1) { sleeper.sleep(1_000) }
}
```

## What NOT to Do

- **Don't assert exception messages** unless the message is part of the public contract
- **Don't verify every mock interaction** — verify only what's meaningful to the test
- **Don't use `relaxed = true` on all mocks** — only relax `Unit` functions when needed
- **Don't duplicate test bodies** — use parameterized tests instead
- **Don't test private methods** — test through the public API
- **Don't mock data classes** — use real instances
- **Don't write integration tests disguised as unit tests** — if you need Spring context, it's an integration test
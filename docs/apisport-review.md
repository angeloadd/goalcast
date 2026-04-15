# ApiSport Code Review

Idiomatic Kotlin review of the ApiSport integration layer.

## High impact

- [ ] **Use Spring's URI builder in `ApiSportClient`** — manual `buildString` with `?`/`&` joining doesn't handle URL encoding. Use `RestClient`'s `.uri { builder -> }` with `queryParam` instead.
- [ ] **Use `apply` for entity mutations** — the "find or create, then set every field, then save" pattern repeats across all sync methods. Wrapping mutations in `apply {}` groups them clearly and is standard Kotlin.
- [ ] **Replace string-typed status/phase with enums** — `"finished"`, `"ongoing"`, `"not_started"` and `"group"`, `"quarter"`, etc. are stringly typed. Kotlin enums with a JPA `@Converter` give compile-time safety and make `mapApiStatus`/`mapRoundToPhase` return typed values.

## Medium impact

- [ ] **Extract rate-limit handling from `ApiSportClient`** — `Thread.sleep(60_000)` inside the `exchange` lambda blocks the thread pool for a full minute. At minimum extract into a dedicated rate-limiter; better yet, log a warning and let the caller decide how to wait.
- [ ] **Add a `HomeAway` destructuring helper** — `gameTeams.find { !it.isAway }` / `gameTeams.find { it.isAway }` repeats in `syncGoals`, `syncGameStatuses`, `syncMissingGoals`, and `syncWinner`. A small `data class HomeAway` with an extension function cleans this up.

## Low impact

- [ ] **Drop redundant `@ResponseStatus(HttpStatus.OK)`** in `SyncController` — 200 is the default for Spring MVC.
- [ ] **Prefer `forEach` over `for` loops where there's no `break`/`continue`** — `syncTeams`, `syncPlayers` etc. use Java-style `for` loops. Idiomatic Kotlin favors functional iteration when control flow doesn't require a loop.
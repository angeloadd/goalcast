# Fantabet: Implementation Task Breakdown

## 1. Clean Up Existing Backend ✅

- [x] Remove `spring-boot-starter-thymeleaf` and `thymeleaf-extras-springsecurity6` from `pom.xml`
- [x] Remove `src/main/resources/templates/` directory
- [x] Remove `MvcConfig.kt`
- [x] Remove explicit `<version>4.0.3</version>` from `spring-boot-starter-web` in `pom.xml`
- [x] Replace `application.properties` with `application.yml` (spring app name, datasource, JPA, Flyway, session cookie
  config)
- [x] Create `application-dev.yml` and `application-prod.yml` profile files

**Outcome:** Backend compiles and starts with no Thymeleaf, no view controllers, YAML config in place.

## 2. Add Backend Dependencies ✅

- [x] Add `spring-boot-starter-data-jpa` (no version)
- [x] Add `postgresql` runtime dependency (no version)
- [x] Add `flyway-core` and `flyway-database-postgresql` (no version)
- [x] Add `spring-boot-starter-validation` (no version)
- [x] Add `spring-session-data-redis` (no version)
- [x] Add `spring-boot-starter-data-redis` (no version)
- [x] Add `spring-boot-devtools` (runtime, optional)
- [x] Add `kotlin-maven-noarg` dependency and `jpa` compiler plugin to `kotlin-maven-plugin`

**Outcome:** `./mvnw compile` succeeds with all dependencies resolved.

## 3. Set Up Docker Compose (Dev Environment) ✅

- [x] Create `docker-compose.yml` at repo root with PostgreSQL 17 service (`fantabet-db`, port 5432, volume `pgdata`)
- [x] Add Valkey 8 Alpine service (`fantabet-valkey`, port 6379)
- [x] Verify `docker compose up -d` starts both containers
- [x] Verify Spring Boot connects to both PostgreSQL and Valkey on startup

**Outcome:** `docker compose up -d` brings up PostgreSQL + Valkey; Spring Boot starts without connection errors.

## 4. Database Schema and JPA Entities ✅

- [x] Create `V1__create_users_table.sql` Flyway migration (id, username, email, password, created_at, updated_at,
  indexes)
- [x] Create `User` JPA entity class (`@Entity`, `@Table(name = "users")`)
- [x] Create `UserRepository` interface extending `JpaRepository` (findByUsername, findByEmail, existsByUsername,
  existsByEmail)
- [x] Verify Flyway runs migration on startup and Hibernate validates schema

**Outcome:** App starts, `flyway_schema_history` table exists, `users` table matches entity.

## 5. Backend Authentication ✅

### 5a. Security Configuration

- [x] Rewrite `WebSecurityConfig.kt`: disable form login, disable CSRF, set `HttpStatusEntryPoint(UNAUTHORIZED)`,
  session creation `IF_REQUIRED`, max sessions 1, logout handler at `/api/auth/logout`
- [x] Configure `Argon2PasswordEncoder` bean
- [x] Expose `AuthenticationManager` bean
- [x] Remove in-memory `UserDetailsService` bean

### 5b. User Service Layer

- [x] Create DTOs: `LoginRequest`, `RegisterRequest`, `UserDto`
- [x] Create `UserService` with `register()` method (validates uniqueness, hashes password, saves user)
- [x] Create `CustomUserDetailsService` implementing `UserDetailsService` (loads from `UserRepository`)

### 5c. Auth Controller

- [x] Create `AuthController` (`@RestController`, `@RequestMapping("/api/auth")`)
- [x] `POST /login` — authenticate via `AuthenticationManager`, store `SecurityContext` in session, return `UserDto`
- [x] `POST /register` — delegate to `UserService`, return 201 + `UserDto`
- [x] `GET /me` — return current user from `@AuthenticationPrincipal`, or 401

### 5d. Error Handling

- [x] Create `GlobalExceptionHandler` (`@RestControllerAdvice`)
- [x] Handle `AuthenticationException` → 401
- [x] Handle `MethodArgumentNotValidException` → 400
- [x] Handle generic `Exception` → 500
- [x] Create `ErrorResponse` data class

**Outcome:** Can register a user via `POST /api/auth/register`, log in via `POST /api/auth/login` (receive session
cookie), call `GET /api/auth/me` (returns user), `POST /api/auth/logout` (clears session). Unauthenticated requests to
protected endpoints return 401 JSON.

## 6. Scaffold Angular Frontend ✅

- [x] Run `ng new frontend --routing --style=scss --ssr=false --skip-git` from repo root
- [x] Verify `cd frontend && ng serve` starts dev server on port 4200

**Outcome:** Angular 21 app running at `http://localhost:4200`.

## 7. Angular Tooling ✅

### 7a. Dev Proxy

- [x] Create `frontend/proxy.conf.json` forwarding `/api` to `http://localhost:8080`
- [x] Add `proxyConfig` to `angular.json` serve options
- [x] Verify `ng serve` proxies `/api` requests to Spring Boot

### 7b. Linting

- [x] Run `ng add @angular-eslint/schematics`
- [x] Install `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`
- [x] Create `frontend/.prettierrc` (singleQuote, trailingComma, printWidth 100, tabWidth 4, semi)
- [x] Add Prettier to `eslint.config.js` (scoped to `**/*.ts` files)
- [x] Add `format` and `format:check` scripts to `package.json`
- [x] Verify `ng lint` and `npm run format` work

### 7c. Testing (Vitest — Angular 21 default)

- [x] Angular 21 ships with vitest built-in (no Jest/Karma setup needed)
- [x] Add `test:watch` and `test:coverage` scripts to `package.json`
- [x] Verify `npm test` runs

**Outcome:** `ng lint`, `npm run format`, `npm test` all work. Proxy forwards `/api` to backend.

## 8. Angular State Management (NgRx) ✅

- [x] Install `@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools`
- [x] Create `auth.actions.ts` (Login, Login Success, Login Failure, Logout, Logout Success, Check Session, Check
  Session Success, Check Session Failure, Clear Error)
- [x] Create `auth.reducer.ts` (AuthState: user, loading, error; handle all actions)
- [x] Create `auth.selectors.ts` (selectCurrentUser, selectIsLoggedIn, selectAuthLoading, selectAuthError)
- [x] Create `auth-api.service.ts` (login, logout, getCurrentUser via HttpClient)
- [x] Create `auth.effects.ts` (login$, loginSuccess$, logout$, logoutSuccess$, checkSession$)
- [x] Register store, effects, and devtools in `app.config.ts` (devtools conditionally via `isDevMode()`)

**Outcome:** NgRx store boots without errors. Actions, reducer, effects, and selectors are wired up.

## 9. Angular Auth UI and Routing ✅

### 9a. Interceptor and Guard

- [x] Create `auth.interceptor.ts` (set `withCredentials: true`, dispatch logout on unexpected 401)
- [x] Create `auth.guard.ts` (check `selectIsLoggedIn` from store, redirect to `/login`)
- [x] Register interceptor in `app.config.ts` via `provideHttpClient(withInterceptors(...))`

### 9b. Session Restoration

- [x] Add `provideAppInitializer` to `app.config.ts` that dispatches `checkSession` and waits for result before
  rendering

### 9c. Components

- [x] Create `LoginComponent` (form with username/password, dispatches `AuthActions.login`, shows loading/error from
  store signals)
- [x] Create `DashboardComponent` (shows current user from store, logout button dispatches `AuthActions.logout`)

### 9d. Routes

- [x] Configure `app.routes.ts`: `/login` → LoginComponent, `/dashboard` → DashboardComponent (guarded), `''` redirects
  to `/dashboard`

### 9e. User Model

- [x] Create `shared/models/user.model.ts` (User interface: username, roles)

**Outcome:** Full auth flow works end-to-end: app loads → checks session → login form → successful login → dashboard
with user info → logout → back to login. Page refresh restores session.

## 10. SPA Fallback ✅

- [x] Create `SpaFallbackController` that forwards non-API, non-static GET requests to `index.html`

**Outcome:** Deep-linking and browser refresh work for all Angular routes.

## 11. Maven Frontend Plugin (Unified Build) ✅

- [x] Add `frontend-maven-plugin` to `pom.xml` (install-node-and-npm, npm ci, npm run build)
- [x] Add `maven-resources-plugin` execution to copy `frontend/dist/frontend/browser` to `target/classes/static`
- [x] Add `frontend/node/`, `frontend/node_modules/`, `frontend/dist/`, `frontend/.angular/` to `.gitignore`
- [x] Verify `./mvnw clean package -DskipTests` produces a JAR that serves both API and Angular

**Outcome:** Single `./mvnw package` builds FE + BE into one runnable JAR.

## 12. Docker Production Setup ✅

### 12a. Dockerfile

- [x] Create multi-stage Dockerfile: Maven build stage (with frontend plugin) → Amazon Corretto 21 Alpine runtime stage

### 12b. Production Docker Compose

- [x] Create `docker-compose.prod.yml` with services: app, db (PostgreSQL), valkey, caddy, dozzle
- [x] Create `Caddyfile` (reverse proxy `fantabet.com` → `app:8080`, automatic TLS)

### 12c. Structured Logging

- [x] Configure `application-prod.yml` with logfmt structured logging
- [x] Set log levels: root INFO, `com.fantabet` DEBUG, Spring Security INFO

**Outcome:** `docker compose -f docker-compose.prod.yml up -d` runs the full stack with HTTPS via Caddy.

## 13. CI/CD (GitHub Actions) ✅

- [x] Create `.github/workflows/deploy.yml`
- [x] Add `test` job: checkout, setup Java 21 Corretto, `./mvnw test`, setup Node 22,
  `cd frontend && npm ci && npm test`
- [x] Add `deploy` job (needs test): SSH into droplet via `appleboy/ssh-action`, `git pull`,
  `docker compose -f docker-compose.prod.yml up -d --build`, `docker image prune -f`
- [x] Required GitHub secrets: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`

**Outcome:** Push to `main` → tests run → on success, app is deployed to the droplet automatically.

## 14. Backend Tests ✅

- [x] Add MockK dependency to `pom.xml` (`mockk-jvm`, version `1.13.16`, test scope)
- [x] Add H2 dependency (test scope)
- [x] Write `UserServiceTest` (unit test with MockK: register creates user with hashed password, duplicate
  username/email)
- [x] Write `AuthControllerTest` (integration test with MockMvc: login returns 200 + user data, invalid login returns
  401, unauthenticated returns 401, register works, duplicate register returns 400)

**Outcome:** `./mvnw test` passes — 9 tests (1 context, 5 integration, 3 unit).

## 15. Frontend Tests ✅

- [x] Write test for `auth.reducer.ts` (7 tests: login sets loading, loginSuccess sets user, loginFailure sets error,
  logout resets, checkSession success/failure, clearError)
- [x] Write test for `auth.guard.ts` (redirects to /login when not logged in, allows when logged in)
- [x] Write test for `auth.interceptor.ts` (adds withCredentials, dispatches logout on 401, skips logout for login
  endpoint)

**Outcome:** `npm test` passes — 13 tests across 4 test files.

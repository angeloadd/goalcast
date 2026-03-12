# Fantabet: Spring Boot (Kotlin) + Angular (TypeScript) Application Setup Guide

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Backend Setup: Spring Boot with Kotlin](#3-backend-setup-spring-boot-with-kotlin)
4. [Frontend Setup: Angular with TypeScript](#4-frontend-setup-angular-with-typescript)
5. [Database Management](#5-database-management)
6. [Authentication and Session Management](#6-authentication-and-session-management)
7. [Frontend-Backend Communication](#7-frontend-backend-communication)
8. [Development Tooling and Workflow](#8-development-tooling-and-workflow)
9. [Testing Strategy](#9-testing-strategy)
10. [Production Build and Deployment](#10-production-build-and-deployment)

---

## 1. Architecture Overview

### Current State

The project currently has:
- Spring Boot 4.0.3 with Kotlin 2.2.21, Java 21
- Maven build system
- Thymeleaf server-side templates for views (`home.html`, `login.html`, `hello.html`)
- Spring Security with form-based login and in-memory user store
- Argon2 password encoding via BouncyCastle

### Target State

We are moving to a **decoupled SPA architecture** where:
- **Spring Boot** acts purely as a REST API server (no Thymeleaf, no server-rendered views)
- **Angular** is a standalone single-page application that communicates with the backend via HTTP/JSON
- The two are developed independently but can be packaged together for deployment

### High-Level Request Flow

```
Browser (Angular SPA)
    |
    | HTTP requests (JSON) to /api/**
    |
    v
Spring Boot (REST API)
    |
    | JPA/Hibernate queries
    |
    v
PostgreSQL Database
```

Angular runs in the browser. When a user navigates the app, Angular handles routing client-side. When data is needed (login, load bets, place a bet), Angular sends an HTTP request to a Spring Boot REST endpoint. Spring Boot processes the request, talks to the database, and returns JSON.

---

## 2. Project Folder Structure

### Monorepo Layout

The recommended structure is a **monorepo** where the Angular frontend lives alongside the Spring Boot backend. This keeps everything in one Git repository, simplifies CI/CD, and makes it easy to keep versions in sync.

```
fantabet/                              # Git repository root
|
+-- pom.xml                            # Maven parent POM (backend build)
+-- mvnw / mvnw.cmd                    # Maven wrapper scripts
+-- .gitignore
+-- .editorconfig                       # Shared editor formatting rules
+-- CLAUDE.md                           # Project conventions for AI tooling
|
+-- src/                                # Spring Boot backend source
|   +-- main/
|   |   +-- kotlin/com/fantabet/fantabet/
|   |   |   +-- FantabetApplication.kt           # Application entry point
|   |   |   +-- config/
|   |   |   |   +-- WebSecurityConfig.kt          # Spring Security configuration
|   |   |   |   +-- CorsConfig.kt                 # CORS settings for Angular dev server
|   |   |   |   +-- JacksonConfig.kt              # JSON serialization settings
|   |   |   +-- controller/
|   |   |   |   +-- AuthController.kt             # Login, logout, register endpoints
|   |   |   |   +-- BetController.kt              # Bet CRUD REST endpoints
|   |   |   |   +-- UserController.kt             # User profile endpoints
|   |   |   +-- service/
|   |   |   |   +-- UserService.kt                # Business logic for users
|   |   |   |   +-- BetService.kt                 # Business logic for bets
|   |   |   +-- repository/
|   |   |   |   +-- UserRepository.kt             # JPA repository interfaces
|   |   |   |   +-- BetRepository.kt
|   |   |   +-- model/
|   |   |   |   +-- User.kt                       # JPA entity classes
|   |   |   |   +-- Bet.kt
|   |   |   +-- dto/
|   |   |   |   +-- LoginRequest.kt               # Data transfer objects
|   |   |   |   +-- LoginResponse.kt
|   |   |   |   +-- BetDto.kt
|   |   |   +-- exception/
|   |   |       +-- GlobalExceptionHandler.kt     # @ControllerAdvice for error responses
|   |   +-- resources/
|   |       +-- application.yml                    # Main config (replaces .properties)
|   |       +-- application-dev.yml                # Dev profile overrides
|   |       +-- application-prod.yml               # Production profile overrides
|   |       +-- db/migration/                      # Flyway SQL migration scripts
|   |           +-- V1__create_users_table.sql
|   |           +-- V2__create_bets_table.sql
|   +-- test/
|       +-- kotlin/com/fantabet/fantabet/
|           +-- controller/                        # Integration tests for REST endpoints
|           +-- service/                           # Unit tests for services
|           +-- repository/                        # Repository tests with @DataJpaTest
|
+-- frontend/                           # Angular application (completely separate)
|   +-- package.json                    # Node dependencies and scripts
|   +-- angular.json                    # Angular CLI workspace configuration
|   +-- tsconfig.json                   # TypeScript compiler settings
|   +-- tsconfig.app.json              # App-specific TS config
|   +-- tsconfig.spec.json            # Test-specific TS config
|   +-- .eslintrc.json                 # Linting rules
|   +-- proxy.conf.json                # Dev proxy to forward /api to Spring Boot
|   +-- src/
|       +-- index.html                  # Single HTML page (SPA entry point)
|       +-- main.ts                     # Angular bootstrap
|       +-- styles.scss                 # Global styles
|       +-- environments/
|       |   +-- environment.ts          # Dev environment config
|       |   +-- environment.prod.ts     # Prod environment config
|       +-- app/
|           +-- app.component.ts        # Root component
|           +-- app.routes.ts           # Route definitions
|           +-- app.config.ts           # Application-level providers
|           +-- core/                   # Singleton services, guards, interceptors
|           |   +-- auth/
|           |   |   +-- auth.service.ts             # Login/logout/session logic
|           |   |   +-- auth.guard.ts               # Route guard for protected pages
|           |   |   +-- auth.interceptor.ts         # Attaches credentials to requests
|           |   +-- api/
|           |       +-- api.service.ts              # Base HTTP wrapper
|           +-- features/              # Feature modules (lazy-loaded)
|           |   +-- login/
|           |   |   +-- login.component.ts
|           |   |   +-- login.component.html
|           |   +-- dashboard/
|           |   |   +-- dashboard.component.ts
|           |   |   +-- dashboard.component.html
|           |   +-- bets/
|           |       +-- bet-list.component.ts
|           |       +-- bet-create.component.ts
|           +-- shared/                # Reusable components, pipes, directives
|               +-- components/
|               +-- models/
|               |   +-- user.model.ts
|               |   +-- bet.model.ts
|               +-- pipes/
|
+-- docs/                               # Project documentation
|   +-- research.md                     # This file
|
+-- docker-compose.yml                  # Local dev: PostgreSQL + optionally pgAdmin
+-- Dockerfile                          # Multi-stage build for production
```

### Why This Layout

- **Backend at root level**: The Spring Boot project stays at the repository root since it was initialized there. Maven's `pom.xml` stays where it is.
- **Frontend in `frontend/`**: Angular lives in its own directory with its own `package.json` and `node_modules`. This prevents any interference between Maven and npm, and makes it clear which tools operate on which code.
- **`docs/`**: Documentation lives alongside the code.
- **Docker at root**: `docker-compose.yml` orchestrates the full local development environment.

---

## 3. Backend Setup: Spring Boot with Kotlin

### What Changes from Current Setup

The current project uses Thymeleaf for server-side rendering. We will:

1. **Remove Thymeleaf**: Delete the `spring-boot-starter-thymeleaf` and `thymeleaf-extras-springsecurity6` dependencies from `pom.xml`. Delete the `src/main/resources/templates/` directory entirely.
2. **Remove MvcConfig**: The `MvcConfig.kt` that maps view controllers is no longer needed since Angular handles all routing.
3. **Add REST API dependencies**: The project already has `spring-boot-starter-web`, which is sufficient for REST controllers.
4. **Add database dependencies**: Add `spring-boot-starter-data-jpa` and a PostgreSQL driver.
5. **Add Flyway**: For database migration management.
6. **Restructure security**: Move from form-based login to a stateful session-based REST API authentication flow (details in section 6).

### Dependencies to Add to pom.xml

#### A Note on Versioning

The project's `pom.xml` inherits from `spring-boot-starter-parent` (version 4.0.3). This parent POM acts as a **Bill of Materials (BOM)** -- it defines a curated set of compatible dependency versions for hundreds of libraries. This means:

- **Spring Boot starters** (`spring-boot-starter-*`): **Never specify a version.** The parent POM already defines the version. Adding an explicit version can cause mismatches. For example, the current `pom.xml` has `spring-boot-starter-web` with `<version>4.0.3</version>` -- that version tag should be removed since the parent already provides it.
- **Flyway, PostgreSQL driver, H2, Jackson, etc.**: These are also managed by the Spring Boot BOM. **Do not specify a version** for these either.
- **Third-party libraries NOT managed by Spring Boot** (like BouncyCastle `bcprov-jdk18on`): These **do need an explicit version** because Spring Boot doesn't know about them.

Rule of thumb: try without a `<version>` tag first. If Maven complains about a missing version, then add one. You can check which versions Spring Boot manages by looking at the [Spring Boot dependency versions page](https://docs.spring.io/spring-boot/appendix/dependency-versions/) for your version (4.0.3).

```xml
<!-- Database - no version needed, managed by spring-boot-starter-parent -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Database migrations - no version needed, managed by parent -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>

<!-- Validation - no version needed -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Session management with Redis as session store -->
<!--
  spring-session-data-redis replaces spring-session-core here.
  It includes spring-session-core transitively AND adds the Redis
  integration so sessions are stored in Redis instead of server memory.

  For local development, you can use an in-memory session store by
  activating a "dev" Spring profile that doesn't configure Redis.
  But in production, Redis is needed so that sessions survive
  application restarts and work across multiple instances.
-->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
<!--
  Spring Boot's Redis starter provides the Lettuce Redis client driver
  (the default, non-blocking Redis client) and auto-configuration.
  No version needed -- managed by parent.
-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

For local development, add a Redis container to `docker-compose.yml` (shown in section 5) or configure the dev profile to use in-memory sessions with `spring.session.store-type=none` in `application-dev.yml`.

### Dependencies to Remove from pom.xml

```xml
<!-- Remove: no longer doing server-side rendering -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```

### application.yml Structure

Replace `application.properties` with `application.yml` for better readability:

```yaml
# application.yml
spring:
  application:
    name: fantabet
  datasource:
    url: jdbc:postgresql://localhost:5432/fantabet
    username: fantabet
    password: ${DB_PASSWORD}           # Read from environment variable
  jpa:
    hibernate:
      ddl-auto: validate               # Flyway manages schema; Hibernate only validates
    open-in-view: false                 # Best practice: disable lazy loading in views
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080
  servlet:
    session:
      cookie:
        http-only: true                 # JavaScript cannot read the session cookie
        secure: false                   # Set true in production (requires HTTPS)
        same-site: lax                  # CSRF protection via SameSite cookie attribute
        name: FANTABET_SESSION
      timeout: 30m                      # Session expires after 30 minutes of inactivity
```

### Backend Layer Architecture

The code is organized into layers, each with a single responsibility:

```
Controller (REST endpoints)
    |  receives HTTP requests, validates input, returns JSON responses
    v
Service (business logic)
    |  orchestrates operations, enforces rules, handles transactions
    v
Repository (data access)
    |  JPA interfaces that Spring auto-implements
    v
Entity / Model (database mapping)
       JPA-annotated Kotlin data classes mapped to database tables
```

**Controllers** are thin: they parse the request, call a service, and return the result. They never contain business logic or database queries directly.

**Services** contain the actual logic. They are annotated with `@Service` and `@Transactional` where needed. They talk to repositories, never to HTTP concepts (no `HttpServletRequest` in services).

**Repositories** extend `JpaRepository<Entity, ID>`. Spring Data generates the implementation at runtime. You only write method signatures like `fun findByEmail(email: String): User?` and Spring generates the SQL.

**DTOs** (Data Transfer Objects) are separate from entities. This prevents accidentally exposing internal database fields (like password hashes) in API responses. Entities have JPA annotations; DTOs are plain Kotlin data classes.

---

## 4. Frontend Setup: Angular with TypeScript

### Initializing the Angular Project

Angular has its own CLI tool that scaffolds and manages the project. From the repository root:

```bash
# Install Angular CLI globally (one time)
npm install -g @angular/cli

# Create a new Angular project inside the monorepo
ng new frontend --routing --style=scss --ssr=false --skip-git
```

Flags explained:
- `--routing`: Generates a routing module for client-side navigation
- `--style=scss`: Uses SCSS (Sass) instead of plain CSS for more powerful styling
- `--ssr=false`: Disables server-side rendering (we don't need it; Spring Boot is our server)
- `--skip-git`: Don't initialize a nested Git repo (we already have one at the root)

This creates the `frontend/` directory with all Angular scaffolding.

### Angular CLI Commands (Daily Usage)

```bash
cd frontend

# Start the development server (with live reload)
ng serve
# App available at http://localhost:4200
# Automatically recompiles and refreshes browser on file changes

# Generate a new component
ng generate component features/login

# Generate a new service
ng generate service core/auth/auth

# Generate a new guard
ng generate guard core/auth/auth

# Run unit tests
ng test

# Build for production
ng build --configuration=production

# Run linting
ng lint
```

### Key Angular Concepts for This Project

**Components** are the building blocks of the UI. Each component has:
- A TypeScript class (logic and data)
- An HTML template (what gets rendered)
- An SCSS file (styles scoped to this component)

**Services** are injectable singletons that hold shared logic and state. The `AuthService` will manage login/logout and expose the current user state. The `ApiService` wraps `HttpClient` for making HTTP calls.

**Interceptors** are middleware for HTTP requests. We use one to ensure every request to the backend includes credentials (the session cookie).

**Guards** protect routes. An `AuthGuard` checks if the user is logged in before allowing navigation to a protected page. If not logged in, it redirects to `/login`.

**Routing** maps URL paths to components. Angular handles this entirely on the client side -- changing the URL does not make a server request. The browser's history API is used to update the URL bar.

### Standalone Components (Modern Angular) Comment: I would like to manage state with ngrx and signal. While it adds complexity to the project, it makes it easier to reason about the app's state.

Modern Angular (v17+) uses **standalone components** by default instead of NgModules. This means:
- Components declare their own imports directly in the `@Component` decorator
- No need for `@NgModule` declarations
- Simpler mental model: each component is self-contained

```typescript
// Example of a standalone component (the modern default)
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // ...
}
```

### proxy.conf.json (Development Proxy)

During development, Angular runs on port 4200 and Spring Boot runs on port 8080. They are different origins, which means the browser would block API requests due to CORS (Cross-Origin Resource Sharing). Instead of configuring CORS for development, we use Angular's built-in proxy:

```json
// frontend/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Then start Angular with the proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

Now when Angular code makes a request to `/api/auth/login`, the dev server forwards it to `http://localhost:8080/api/auth/login`. The browser sees the request as same-origin (port 4200), so no CORS issues arise.

In `angular.json`, you can make this the default so you don't need the flag every time:

```json
"serve": {
  "options": {
    "proxyConfig": "frontend/proxy.conf.json"
  }
}
```

---

## 5. Database Management

### PostgreSQL via Docker Compose

For local development, run PostgreSQL in a Docker container so everyone on the team has an identical database setup:

```yaml
# docker-compose.yml (at repository root)
services:
  db:
    image: postgres:17
    container_name: fantabet-db
    environment:
      POSTGRES_DB: fantabet
      POSTGRES_USER: fantabet
      POSTGRES_PASSWORD: fantabet_dev     # Only for local dev!
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data   # Data persists across container restarts

volumes:
  pgdata:
```

Start it with:

```bash
docker compose up -d
```

### Flyway Database Migrations

Flyway manages the database schema through versioned SQL scripts. Instead of letting Hibernate auto-create/modify tables (which is fragile and non-reproducible), every schema change is an explicit, versioned SQL file.

Migration files live in `src/main/resources/db/migration/` and follow the naming convention:

```
V1__create_users_table.sql
V2__create_bets_table.sql
V3__add_avatar_url_to_users.sql
```

The naming rules are:
- `V` followed by a version number (monotonically increasing)
- Two underscores `__` as separator
- A descriptive name (underscores for spaces)
- `.sql` extension

Example migration:

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

When the Spring Boot application starts, Flyway:
1. Checks a `flyway_schema_history` table in the database to see which migrations have already been applied
2. Runs any new migrations (higher version numbers) in order
3. Records each successful migration in the history table

This means every developer and every environment (dev, staging, prod) always has the same schema, and you have a complete history of every change.

### JPA Entities (Kotlin)

Kotlin JPA entities require some specific setup because JPA needs no-arg constructors and open classes, while Kotlin classes are final by default and data classes have required constructor parameters.

The `kotlin-maven-allopen` plugin (already in your `pom.xml`) makes Spring-annotated classes open. For JPA, you also need the `kotlin-jpa` plugin which generates no-arg constructors for `@Entity`, `@MappedSuperclass`, and `@Embeddable` classes.

Add to `pom.xml` kotlin-maven-plugin configuration:

```xml
<compilerPlugins>
    <plugin>spring</plugin>
    <plugin>jpa</plugin>      <!-- Add this -->
</compilerPlugins>
```

And add the dependency:

```xml
<dependency>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-maven-noarg</artifactId>
    <version>${kotlin.version}</version>
</dependency>
```

Example entity:

```kotlin
@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true, length = 50)
    val username: String,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    var password: String,              // var because password can be changed

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
```

Note: use `class`, not `data class`, for JPA entities. Data classes generate `equals`/`hashCode` based on all fields, which causes issues with JPA proxies and lazy loading. Use a regular class and override `equals`/`hashCode` based on the ID if needed.

### Repository Interface

```kotlin
interface UserRepository : JpaRepository<User, Long> {
    fun findByUsername(username: String): User?
    fun findByEmail(email: String): User?
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
}
```

Spring Data JPA generates the SQL for these methods automatically based on the method name.

---

## 6. Authentication and Session Management

This is the most critical section. Getting auth right requires understanding how browsers, cookies, sessions, CORS, and CSRF all interact.

### Authentication Strategy: Session-Based Auth (Not JWT)

There are two common approaches for SPA authentication:
1. **Session-based** (server stores session, browser stores session cookie)
2. **JWT-based** (server is stateless, browser stores token)

**We choose session-based authentication.** Here is why:

| Aspect | Session-Based | JWT-Based |
|--------|--------------|-----------|
| Storage | Server-side (memory/Redis/DB) | Client-side (localStorage/cookie) |
| Revocation | Instant (delete session on server) | Hard (must maintain a blocklist, defeating the purpose) |
| Token size | Small cookie (~32 bytes) | Large token (~800+ bytes per request) |
| Security | Cookie can be httpOnly (no JS access) | If in localStorage, vulnerable to XSS. If in cookie, same as sessions but more complex |
| Complexity | Simple, well-understood | More moving parts (refresh tokens, rotation, expiry) |
| Scaling | Needs shared session store (Redis) | Stateless (no shared store needed) |

For a friend-group betting app, the simplicity and security advantages of sessions far outweigh the scaling benefit of JWTs. If you ever need to scale, adding Redis as a session store is straightforward.

### How Session-Based Auth Works (Step by Step) Comment: I would go for key-value store both in prod and dev. In dev I can setup everything using docker-compose.

#### Step 1: User Submits Login Form

The Angular app shows a login form. When the user submits:

```
POST /api/auth/login
Content-Type: application/json

{"username": "cicciofrizzo", "password": "Adamo123"}
```

#### Step 2: Spring Boot Validates Credentials

The `AuthController` receives the request, delegates to `AuthenticationManager`, which:
1. Calls `UserDetailsService.loadUserByUsername("cicciofrizzo")`
2. Retrieves the user from the database
3. Uses `PasswordEncoder.matches()` to compare the submitted password against the stored Argon2 hash
4. If valid, creates an `Authentication` object

#### Step 3: Spring Creates a Session

Upon successful authentication, Spring Security:
1. Creates a new `HttpSession` on the server (stored in memory, or Redis in production)
2. Stores the `SecurityContext` (which contains the authenticated user's details) inside that session
3. Generates a unique session ID (a random, unguessable string)

#### Step 4: Server Sends Session Cookie

The HTTP response includes a `Set-Cookie` header:

```
HTTP/1.1 200 OK
Set-Cookie: FANTABET_SESSION=abc123def456; Path=/; HttpOnly; SameSite=Lax
Content-Type: application/json

{"username": "cicciofrizzo", "roles": ["USER"]}
```

The cookie attributes are critical:
- **`HttpOnly`**: JavaScript cannot read this cookie via `document.cookie`. This protects against XSS attacks stealing the session.
- **`SameSite=Lax`**: The browser only sends this cookie with same-site requests or top-level navigations. This protects against CSRF attacks.
- **`Secure`** (in production): The cookie is only sent over HTTPS.
- **`Path=/`**: The cookie is sent for all paths on the domain.

#### Step 5: Browser Stores the Cookie Automatically

The browser's cookie jar stores the session cookie. **No JavaScript code is needed to store it.** This is a browser-native behavior. The cookie is invisible to your Angular code.

#### Step 6: Subsequent Requests Include the Cookie

Every subsequent HTTP request to the same origin automatically includes the cookie:

```
GET /api/bets
Cookie: FANTABET_SESSION=abc123def456
```

Spring Boot receives the request, reads the session ID from the cookie, looks up the session on the server, finds the `SecurityContext` with the authenticated user, and processes the request knowing who the user is.

#### Step 7: Logout

```
POST /api/auth/logout
Cookie: FANTABET_SESSION=abc123def456
```

Spring Security invalidates the server-side session and responds with a `Set-Cookie` that clears the cookie:

```
HTTP/1.1 200 OK
Set-Cookie: FANTABET_SESSION=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax
```

### Backend Security Configuration (Spring Security)

The current `WebSecurityConfig.kt` needs significant rework. Here is what the new configuration should look like conceptually:

```kotlin
@Configuration
@EnableWebSecurity
class WebSecurityConfig(
    private val userDetailsService: CustomUserDetailsService
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize("/api/auth/login", permitAll)
                authorize("/api/auth/register", permitAll)
                authorize("/api/**", authenticated)
                // Static Angular files served from root are always permitted
                authorize(anyRequest, permitAll)
            }

            // Disable form login -- we handle login manually via a REST endpoint
            formLogin { disable() }

            // Disable CSRF for the API.
            // WHY THIS IS SAFE: We use SameSite=Lax cookies, which prevent
            // cross-origin sites from sending authenticated requests.
            // Traditional CSRF tokens are designed for form-based apps;
            // for a SPA with SameSite cookies, they add complexity without benefit.
            csrf { disable() }

            // Return 401 instead of redirecting to a login page
            exceptionHandling {
                authenticationEntryPoint = HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
            }

            // Session management
            sessionManagement {
                sessionCreationPolicy = SessionCreationPolicy.IF_REQUIRED
                maximumSessions = 1    // One session per user
            }

            logout {
                logoutUrl = "/api/auth/logout"
                logoutSuccessHandler = HttpStatusReturningLogoutSuccessHandler()
                invalidateHttpSession = true
                deleteCookies("FANTABET_SESSION")
            }
        }

        return http.build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return Argon2PasswordEncoder(16, 32, 1, 64, 3)
    }

    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager {
        return config.authenticationManager
    }
}
```

Key differences from the current config:
- **No `formLogin`**: We don't want Spring's built-in login page or form processing. Our Angular app has its own login form and submits JSON to a REST endpoint.
- **`csrf { disable() }`**: Explained above. SameSite cookies provide equivalent protection for our use case.
- **`HttpStatusEntryPoint(UNAUTHORIZED)`**: When an unauthenticated request hits a protected endpoint, Spring returns `401 Unauthorized` as JSON instead of redirecting to `/login` (which is what form login does). Angular intercepts this 401 and redirects to the login page itself.
- **Session creation `IF_REQUIRED`**: A session is created only when needed (i.e., after login), not for every anonymous request.

### Auth Controller (REST Endpoint)

The login endpoint is a regular `@RestController`, not a Spring Security form handler:

```kotlin
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService
) {
    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest, session: HttpSession): ResponseEntity<UserDto> {
        // 1. Authenticate with Spring Security
        val authToken = UsernamePasswordAuthenticationToken(request.username, request.password)
        val authentication = authenticationManager.authenticate(authToken)
        // If credentials are wrong, authenticate() throws AuthenticationException
        // which GlobalExceptionHandler catches and returns 401

        // 2. Store authentication in the SecurityContext and bind to session
        val context = SecurityContextHolder.createEmptyContext()
        context.authentication = authentication
        SecurityContextHolder.setContext(context)
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        )

        // 3. Return user info (no password!)
        val user = authentication.principal as UserDetails
        return ResponseEntity.ok(UserDto(user.username, user.authorities.map { it.authority }))
    }

    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): ResponseEntity<UserDto> {
        val user = userService.register(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(user)
    }

    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal user: UserDetails?): ResponseEntity<UserDto> {
        // Returns the currently logged-in user, or 401 if not authenticated
        return if (user != null) {
            ResponseEntity.ok(UserDto(user.username, user.authorities.map { it.authority }))
        } else {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }
    }
}
```

The `GET /api/auth/me` endpoint is important: when Angular loads in the browser (or on page refresh), it doesn't know if the user has an active session. It calls this endpoint to check. If the session cookie is present and valid, it gets back the user details. If not, it gets a 401 and knows to show the login page.

### Custom UserDetailsService (Database-Backed)

Replace the in-memory user store with a database-backed one:

```kotlin
@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val user = userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User not found: $username")

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.username)
            .password(user.password)     // Already hashed in the database
            .roles("USER")
            .build()
    }
}
```

### Angular Auth Service

```typescript
// core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  // Expose as readonly signal for components to consume
  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient) {}

  /**
   * Called when the app starts (in APP_INITIALIZER).
   * Checks if the user already has a valid session.
   */
  checkSession(): Observable<User | null> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/login', { username, password }).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }
}
```

### Angular HTTP Interceptor (Credentials)

By default, the browser does not send cookies with cross-origin requests made via `fetch` or `XMLHttpRequest`. Even though we use a proxy in development (making requests same-origin), we still need `withCredentials: true` for production where the API might be on a different subdomain.

```typescript
// core/auth/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add withCredentials so the browser sends the session cookie
  const authReq = req.clone({ withCredentials: true });
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Redirect to login page
        inject(Router).navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

Register it in the application config:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
```

### Angular Route Guard

```typescript
// core/auth/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

Use it in routes:

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'bets', component: BetListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
```

### Session Lifecycle Summary

```
1. App loads in browser
   Angular calls GET /api/auth/me
   |
   +-- 200 OK with user data -> user is logged in, show dashboard
   +-- 401 Unauthorized -> user is not logged in, show login page

2. User logs in
   Angular sends POST /api/auth/login with username/password
   |
   +-- 200 OK -> server created session, Set-Cookie header sent
   |             browser stores cookie automatically
   |             Angular stores user info in AuthService
   |             navigate to /dashboard
   +-- 401 Unauthorized -> bad credentials, show error message

3. User navigates the app
   Every API request automatically includes the session cookie
   Server looks up session, finds the authenticated user
   If session expired -> 401 -> interceptor redirects to login

4. User logs out
   Angular sends POST /api/auth/logout
   Server invalidates session
   Cookie is cleared via Set-Cookie: Max-Age=0
   Angular clears user state, navigates to /login

5. Session expires (timeout)
   Next API request returns 401
   Interceptor catches it, redirects to /login
```

---

## 7. Frontend-Backend Communication

### REST API Design Conventions

All backend endpoints live under the `/api` prefix. This creates a clear boundary between API routes and static Angular files.

```
/api/auth/login          POST    Log in (public)
/api/auth/register       POST    Register new account (public)
/api/auth/logout         POST    Log out (authenticated)
/api/auth/me             GET     Get current user (authenticated)

/api/bets                GET     List all bets
/api/bets                POST    Create a new bet
/api/bets/{id}           GET     Get a specific bet
/api/bets/{id}           PUT     Update a bet
/api/bets/{id}           DELETE  Delete a bet

/api/users/{id}          GET     Get user profile
/api/users/{id}          PUT     Update user profile
```

### HTTP Response Conventions

Spring Boot controllers should return consistent JSON structures:

**Success:**
```json
{
  "id": 1,
  "description": "Roma wins Serie A",
  "odds": 2.5,
  "createdBy": "cicciofrizzo"
}
```

**Error (via GlobalExceptionHandler):**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Username must be between 3 and 50 characters",
  "timestamp": "2026-03-12T10:00:00Z"
}
```

### Global Exception Handler

```kotlin
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthException(ex: AuthenticationException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse(401, "Unauthorized", "Invalid credentials"))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val message = ex.bindingResult.fieldErrors
            .joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.badRequest()
            .body(ErrorResponse(400, "Bad Request", message))
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse(500, "Internal Server Error", "Something went wrong"))
    }
}

data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val timestamp: Instant = Instant.now()
)
```

### Angular HttpClient Usage

Angular's `HttpClient` is the tool for making HTTP requests. It returns RxJS `Observable`s.

```typescript
// core/api/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getBets(): Observable<Bet[]> {
    return this.http.get<Bet[]>('/api/bets');
  }

  getBet(id: number): Observable<Bet> {
    return this.http.get<Bet>(`/api/bets/${id}`);
  }

  createBet(bet: CreateBetRequest): Observable<Bet> {
    return this.http.post<Bet>('/api/bets', bet);
  }

  updateBet(id: number, bet: UpdateBetRequest): Observable<Bet> {
    return this.http.put<Bet>(`/api/bets/${id}`, bet);
  }

  deleteBet(id: number): Observable<void> {
    return this.http.delete<void>(`/api/bets/${id}`);
  }
}
```

Note that the URLs are relative (no `http://localhost:8080`). In development, the Angular proxy forwards them to Spring Boot. In production, they resolve to the same server since Angular's built files are served by Spring Boot.

### TypeScript Models (Matching Backend DTOs)

```typescript
// shared/models/user.model.ts
export interface User {
  username: string;
  roles: string[];
}

// shared/models/bet.model.ts
export interface Bet {
  id: number;
  description: string;
  odds: number;
  createdBy: string;
  createdAt: string;    // ISO 8601 date string
}

export interface CreateBetRequest {
  description: string;
  odds: number;
}
```

### CORS Configuration (Not Needed for Same-Origin)

Since both frontend and backend will be served from the **same origin** (`https://fantabet.com/` for Angular static files and `https://fantabet.com/api/**` for REST endpoints), **no CORS configuration is needed at all** -- neither in development nor in production.

Here is why:

- **Same origin** means same scheme (`https`), same host (`fantabet.com`), and same port (443, the default for HTTPS). The `/api` path prefix does not affect the origin -- it is just a path on the same domain.
- The browser's Same-Origin Policy only blocks requests to a **different** origin (e.g., `https://api.fantabet.com` would be a different origin from `https://fantabet.com`).
- Since our setup is single-origin, the browser treats all requests from the Angular app to `/api/**` as same-origin and sends cookies automatically without any CORS headers.

**In development**, the Angular proxy (`proxy.conf.json`) makes requests appear same-origin by forwarding `/api/**` from `localhost:4200` to `localhost:8080`. The browser only sees `localhost:4200`.

**In production**, Spring Boot serves both the Angular static files and the API endpoints. Everything is `https://fantabet.com`, so there is no cross-origin concern.

```
Development:
  Browser -> http://localhost:4200 (Angular dev server)
                  |
                  | proxy forwards /api/** requests
                  v
           http://localhost:8080 (Spring Boot)

Production:
  Browser -> https://fantabet.com (Spring Boot serves everything)
                  |
                  | /api/** -> Spring Boot REST handlers
                  | /**     -> Angular's index.html (SPA fallback)
```

**You do not need a `CorsConfig.kt` class.** If you ever change the architecture to use separate domains (e.g., `api.fantabet.com`), you would need to add CORS at that point, but for this single-origin setup you can skip it entirely.

---

## 8. Development Tooling and Workflow

### Required Tools

| Tool | Purpose | Install |
|------|---------|---------|
| JDK 21 | Run Spring Boot | `brew install openjdk@21` |
| Maven (via wrapper) | Build backend | Already in project (`mvnw`) |
| Node.js 20+ | Run Angular tooling | `brew install node` |
| npm | Manage JS dependencies | Comes with Node.js |
| Angular CLI | Scaffold and manage Angular | `npm install -g @angular/cli` |
| angular-eslint | Lint TypeScript and templates | `ng add @angular-eslint/schematics` |
| Jest | Frontend unit testing | `npm install --save-dev jest jest-preset-angular @types/jest` |
| Docker & Docker Compose | Run PostgreSQL + Redis locally | `brew install --cask docker` |
| IntelliJ IDEA | IDE for Kotlin + Angular | Already in use |

### TypeScript Linting with angular-eslint

The Angular CLI has first-party ESLint support via the `angular-eslint` package. It requires minimal configuration and integrates directly with `ng lint`.

**Setup** (run once from the `frontend/` directory):

```bash
ng add @angular-eslint/schematics
```

This single command does everything automatically:
- Installs `@angular-eslint/builder`, `@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template`, and `@angular-eslint/template-parser` as dev dependencies
- Installs `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
- Creates an `eslint.config.js` (flat config format, the modern ESLint default) with sensible Angular-specific rules pre-configured
- Updates `angular.json` to wire `ng lint` to ESLint

After that, linting works out of the box:

```bash
# Lint the entire project
ng lint

# Lint and auto-fix what can be fixed
ng lint --fix
```

No additional configuration files to create or maintain. The generated config includes rules for both TypeScript files and Angular HTML templates (catching things like invalid banana-in-a-box syntax `([ngModel])` instead of `[(ngModel)]`).

If you use IntelliJ IDEA, enable the ESLint integration in Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint, and point it to the `frontend/` directory. This gives you inline linting feedback as you type.

### Daily Development Workflow

1. **Start the database:**
   ```bash
   docker compose up -d
   ```

2. **Start the backend (in one terminal):**
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend starts on http://localhost:8080. Flyway runs migrations automatically.

3. **Start the frontend (in another terminal):**
   ```bash
   cd frontend
   ng serve --proxy-config proxy.conf.json
   ```
   The frontend starts on http://localhost:4200 with live reload.

4. **Develop:** Edit Kotlin files and the backend auto-restarts (Spring DevTools). Edit Angular files and the browser auto-refreshes (Webpack HMR).

5. **Test:**
   ```bash
   # Backend tests
   ./mvnw test

   # Frontend tests
   cd frontend && ng test
   ```

### Spring DevTools (Automatic Restart)

Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

This watches for class file changes and restarts the application context automatically. It uses a fast restart mechanism that reloads only your code, not the entire framework.

### Useful IntelliJ Setup

- Install the **Angular** plugin for template support, completion, and navigation
- Enable **Build project automatically** in settings for DevTools to detect changes
- Set the **Kotlin code style** to the official Kotlin style guide
- Configure **ESLint** for the `frontend/` directory

---

## 9. Testing Strategy

### Backend Testing

**Unit tests** (for services): Use JUnit 5 + Mockito (or MockK for idiomatic Kotlin mocking Comment: I will use Mockk indeed). Test business logic in isolation by mocking repository interfaces.

```kotlin
@ExtendWith(MockKExtension::class)
class UserServiceTest {
    @MockK lateinit var userRepository: UserRepository
    @MockK lateinit var passwordEncoder: PasswordEncoder
    @InjectMockKs lateinit var userService: UserService

    @Test
    fun `register creates user with hashed password`() {
        every { userRepository.existsByUsername("cicciofrizzo") } returns false
        every { passwordEncoder.encode("Adamo123") } returns "hashed"
        every { userRepository.save(any()) } answers { firstArg() }

        val result = userService.register(RegisterRequest("cicciofrizzo", "ciccio@email.com", "Adamo123"))

        verify { passwordEncoder.encode("Adamo123") }
        assertThat(result.username).isEqualTo("cicciofrizzo")
    }
}
```

**Integration tests** (for controllers): Use `@SpringBootTest` with `MockMvc` or `WebTestClient` to test HTTP endpoints end-to-end.

```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {
    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `login with valid credentials returns 200 and session cookie`() {
        mockMvc.post("/api/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"username": "cicciofrizzo", "password": "Adamo123"}"""
        }.andExpect {
            status { isOk() }
            cookie { exists("FANTABET_SESSION") }
            jsonPath("$.username") { value("cicciofrizzo") }
        }
    }

    @Test
    fun `accessing protected endpoint without session returns 401`() {
        mockMvc.get("/api/bets").andExpect {
            status { isUnauthorized() }
        }
    }
}
```

**Repository tests**: Use `@DataJpaTest` which auto-configures an embedded database (H2) and scans only JPA components.

Add H2 for test scope:
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

### Frontend Testing with Jest

Instead of Angular's default Karma + Jasmine setup, we use **Jest** with **jest-preset-angular**. Jest is faster (runs tests in parallel, no browser needed), has better developer experience (watch mode, snapshot testing), and has a much larger ecosystem.

**Setup** (from `frontend/` directory):

```bash
# Install Jest and the Angular preset
npm install --save-dev jest jest-preset-angular @types/jest

# Remove Karma/Jasmine (installed by Angular CLI by default)
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter
```

Create `frontend/jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterSetup: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
```

Create `frontend/setup-jest.ts`:

```typescript
import 'jest-preset-angular/setup-jest';
```

Update `frontend/tsconfig.spec.json` to use Jest types instead of Jasmine:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jest"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

Update `frontend/package.json` scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Now tests run with `npm test` (or `jest --watch` for continuous feedback during development).

The test syntax is nearly identical to Jasmine -- `describe`, `it`, `expect` all work the same way. Angular's `TestBed` and `HttpTestingController` work unchanged with Jest:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should set current user on successful login', () => {
    const mockUser = { username: 'cicciofrizzo', roles: ['USER'] };

    service.login('cicciofrizzo', 'Adamo123').subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockUser);
  });
});
```

Note: the only syntax difference from Jasmine is matchers like `toBeTrue()` become `toBe(true)` in Jest.

### Testing Strategy: No E2E for Now

The testing approach focuses on two layers:

- **Frontend unit tests (Jest)**: Test core logic in Angular services, guards, and interceptors. Mock HTTP calls with `HttpTestingController`. Fast, reliable, easy to maintain.
- **Backend integration tests (MockMvc / @SpringBootTest)**: Test the full request lifecycle from HTTP to database and back. These cover the API contract, security rules, and data flow. Since Spring Boot integration tests spin up the actual application context and hit a real (in-memory H2) database, they provide high confidence without the complexity of browser-based E2E tests.

This combination covers the most critical paths. E2E tests (Cypress, Playwright) can be added later if needed, but the setup and maintenance cost is high relative to the value they add at this stage.

---

## 10. Production Build and Deployment

### Single Deployable JAR (Recommended)

The simplest production setup bundles Angular's compiled files inside Spring Boot's JAR. One artifact, one process to deploy.

#### Build Process

1. **Build Angular for production:**
   ```bash
   cd frontend
   ng build --configuration=production
   ```
   This creates optimized, minified files in `frontend/dist/frontend/browser/` (tree-shaken, AOT-compiled, fingerprinted filenames for cache busting).

2. **Copy Angular output to Spring Boot's static resources:**
   ```bash
   cp -r frontend/dist/frontend/browser/* src/main/resources/static/
   ```

3. **Build the Spring Boot JAR:**
   ```bash
   ./mvnw clean package -DskipTests
   ```

4. **Run:**
   ```bash
   java -jar target/fantabet-0.0.1-SNAPSHOT.jar
   ```

#### SPA Fallback Controller

When Angular uses client-side routing (e.g., the user navigates to `/dashboard`), and then refreshes the page, the browser sends `GET /dashboard` to the server. Spring Boot doesn't have a `/dashboard` endpoint -- that's an Angular route. You need a fallback that serves `index.html` for any request that doesn't match a known API endpoint or static file:

```kotlin
@Controller
class SpaFallbackController {
    @RequestMapping(
        value = ["/{path:^(?!api|static|assets|.*\\.).*}/**"],
        method = [RequestMethod.GET]
    )
    fun forward(): String {
        return "forward:/index.html"
    }
}
```

This regex matches any path that:
- Does NOT start with `api` (our REST endpoints)
- Does NOT start with `static` or `assets` (resource directories)
- Does NOT contain a dot (e.g., `favicon.ico`, `main.js`)

Everything else is forwarded to `index.html`, where Angular's router takes over.

### Docker Multi-Stage Build

```dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npx ng build --configuration=production

# Stage 2: Build Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY pom.xml .
COPY src/ src/
COPY --from=frontend-build /app/frontend/dist/frontend/browser/ src/main/resources/static/
RUN mvn clean package -DskipTests

# Stage 3: Runtime (Amazon Corretto - AWS's production-grade OpenJDK)
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=backend-build /app/target/fantabet-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

This produces a small production image (~200MB) with Amazon Corretto 21 (AWS's free, long-term-supported OpenJDK distribution) and the application JAR.

### Running the Container in Production

Spring Boot's embedded Tomcat server is production-ready out of the box -- you do **not** need Nginx, Apache, or any external web server in front of it for a typical deployment. The JAR is fully self-contained: it serves the Angular static files, handles API requests, and manages TLS termination can be handled at the infrastructure level.

#### Option 1: Docker Compose on a VPS (Simplest)

For a small app like Fantabet, running Docker Compose on a single VPS (DigitalOcean Droplet, Hetzner, AWS EC2, etc.) is the most straightforward approach:

```yaml
# docker-compose.prod.yml
services:
  app:
    image: fantabet:latest
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: redis
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:17
    environment:
      POSTGRES_DB: fantabet
      POSTGRES_USER: fantabet
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app
    restart: unless-stopped

volumes:
  pgdata:
  caddy_data:
```

#### TLS/HTTPS with Caddy (Reverse Proxy)

While Spring Boot can handle HTTP directly, you need a reverse proxy in front for HTTPS/TLS termination. **Caddy** is the simplest option because it automatically obtains and renews Let's Encrypt certificates with zero configuration:

```
# Caddyfile
fantabet.com {
    reverse_proxy app:8080
}
```

That's the entire config. Caddy will:
1. Listen on ports 80 and 443
2. Automatically obtain a TLS certificate from Let's Encrypt for `fantabet.com`
3. Redirect all HTTP traffic to HTTPS
4. Forward all requests to the Spring Boot container on port 8080
5. Automatically renew the certificate before it expires

The request flow in production becomes:

```
Internet -> Caddy (ports 80/443, TLS termination)
                |
                | plain HTTP to internal Docker network
                v
            Spring Boot (port 8080)
                |
                | /api/** -> REST handlers
                | /**     -> Angular static files (index.html fallback)
```

#### Deploying and Updating Comment: I will deploy on a DigitalOcean droplet but I want to try and setup a github action that deploys to the droplet and run the command to update the docker image. Also I would like to setup a logging reading service. How can I do that?

On your VPS, the deployment workflow is:

```bash
# First time: clone the repo, create a .env file with DB_PASSWORD
git clone <repo-url> fantabet
cd fantabet
echo "DB_PASSWORD=your-secure-password" > .env

# Build and start everything
docker compose -f docker-compose.prod.yml up -d --build

# To update after pushing new code:
git pull
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f app
```

#### Option 2: AWS ECS / Cloud Run (If You Want Managed Infrastructure)

If you prefer not to manage a server, you can push the Docker image to a container registry (ECR, Docker Hub) and deploy to:
- **AWS ECS Fargate**: Serverless containers on AWS. Pairs with RDS for PostgreSQL and ElastiCache for Redis.
- **Google Cloud Run**: Serverless containers that scale to zero. Pairs with Cloud SQL and Memorystore.

These require more initial setup but eliminate server maintenance. For a friends-group app, the VPS approach is simpler and cheaper.

### Automating the Build with Maven Frontend Plugin (Optional) Comment: I want to use this to manage the build with mvn

Instead of manually running `npm` and copying files, the `frontend-maven-plugin` can integrate the Angular build into Maven:

```xml
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.15.0</version>
    <configuration>
        <workingDirectory>frontend</workingDirectory>
        <nodeVersion>v20.11.0</nodeVersion>
    </configuration>
    <executions>
        <execution>
            <id>install-node-and-npm</id>
            <goals><goal>install-node-and-npm</goal></goals>
        </execution>
        <execution>
            <id>npm-install</id>
            <goals><goal>npm</goal></goals>
            <configuration>
                <arguments>ci</arguments>
            </configuration>
        </execution>
        <execution>
            <id>npm-build</id>
            <goals><goal>npm</goal></goals>
            <configuration>
                <arguments>run build -- --configuration=production</arguments>
            </configuration>
        </execution>
    </executions>
</plugin>
```

Combined with a `maven-resources-plugin` execution to copy the built files to `target/classes/static/`, this makes `./mvnw package` build everything -- frontend and backend -- in one command.

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Decoupled SPA (Angular) + REST API (Spring Boot) | Clear separation, better UX, independent development |
| Auth mechanism | Server-side sessions with HttpOnly cookies | Simple, secure, easily revocable |
| CSRF protection | SameSite=Lax cookie attribute (no CSRF tokens) | Sufficient for SPA + JSON API; simpler than synchronizer tokens |
| CORS | Not needed (same origin) | FE and BE both served from same domain |
| Password hashing | Argon2 (already in place) | Best current algorithm for password hashing |
| Database | PostgreSQL | Robust, free, excellent JPA support |
| Session store | Redis (via spring-session-data-redis) | Sessions survive restarts, scalable |
| Schema management | Flyway versioned migrations | Reproducible, auditable schema history |
| Build system | Maven (backend) + npm/Angular CLI (frontend) | Standard tools for each ecosystem |
| Dev proxy | Angular `proxy.conf.json` forwarding `/api` to `:8080` | Avoids CORS in development, zero config |
| Production deployment | Single JAR with Angular in `/static`, behind Caddy | One artifact, automatic HTTPS via Let's Encrypt |
| Container runtime | Amazon Corretto 21 Alpine | AWS-backed, long-term support, small image |
| Frontend linting | angular-eslint via `ng lint` | Zero-config, first-party Angular integration |
| Frontend testing | Jest + jest-preset-angular | Fast, no browser needed, large ecosystem |
| Backend testing | JUnit 5 + MockK + MockMvc | Unit tests for services, integration tests for API |
| ORM | JPA/Hibernate via Spring Data | Standard, well-documented, Kotlin-compatible with plugins |

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

### Target State

The application is a **decoupled SPA architecture** where:
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

Angular runs in the browser. When a user navigates the app, Angular handles routing client-side. When data is needed (login, check session, load user profile), Angular sends an HTTP request to a Spring Boot REST endpoint. Spring Boot processes the request, talks to the database, and returns JSON.

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
|   |   |   |   +-- JacksonConfig.kt              # JSON serialization settings
|   |   |   +-- controller/
|   |   |   |   +-- AuthController.kt             # Login, logout, register endpoints
|   |   |   |   +-- UserController.kt             # User profile endpoints
|   |   |   +-- service/
|   |   |   |   +-- UserService.kt                # Business logic for users
|   |   |   +-- repository/
|   |   |   |   +-- UserRepository.kt             # JPA repository interfaces
|   |   |   +-- model/
|   |   |   |   +-- User.kt                       # JPA entity classes
|   |   |   +-- dto/
|   |   |   |   +-- LoginRequest.kt               # Data transfer objects
|   |   |   |   +-- LoginResponse.kt
|   |   |   |   +-- UserDto.kt
|   |   |   +-- exception/
|   |   |       +-- GlobalExceptionHandler.kt     # @ControllerAdvice for error responses
|   |   +-- resources/
|   |       +-- application.yml                    # Main config (replaces .properties)
|   |       +-- application-dev.yml                # Dev profile overrides
|   |       +-- application-prod.yml               # Production profile overrides
|   |       +-- db/migration/                      # Flyway SQL migration scripts
|   |           +-- V1__create_users_table.sql
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
|           |       +-- api.service.ts              # Base HTTP wrapper (optional, for shared API logic)
|           +-- features/              # Feature modules (lazy-loaded)
|           |   +-- login/
|           |   |   +-- login.component.ts
|           |   |   +-- login.component.html
|           |   +-- dashboard/
|           |   |   +-- dashboard.component.ts
|           |   |   +-- dashboard.component.html
|           +-- shared/                # Reusable components, pipes, directives
|               +-- components/
|               +-- models/
|               |   +-- user.model.ts
|               +-- pipes/
|
+-- docs/                               # Project documentation
|   +-- setup.md                        # This file
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

For local development, add a Valkey container to `docker-compose.yml` (shown in section 5). The Spring dependencies still say "redis" because they target the Redis wire protocol, which Valkey implements identically.

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

**Services** are injectable singletons that act as a **middle layer between components and the NgRx store**. Components never dispatch actions directly -- they call service methods instead. Services handle orchestration: they dispatch actions to the store and can also perform simple logic that doesn't need to go through the full action/reducer cycle. This keeps components thin and testable, while keeping the store focused on state transitions. The `AuthService` exposes methods like `login()` and `logout()` that internally dispatch NgRx actions. The `ApiService` wraps `HttpClient` for making HTTP calls (used inside NgRx Effects, not in components directly).

**Interceptors** are middleware for HTTP requests. We use one to ensure every request to the backend includes credentials (the session cookie).

**Guards** protect routes. An `AuthGuard` checks if the user is logged in before allowing navigation to a protected page. If not logged in, it redirects to `/login`.

**Routing** maps URL paths to components. Angular handles this entirely on the client side -- changing the URL does not make a server request. The browser's history API is used to update the URL bar.

### Standalone Components (Modern Angular)

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

### State Management with NgRx Store + Signals

We use the **classic NgRx Store** (`@ngrx/store` + `@ngrx/effects`) with Angular signals integration via `selectSignal`. This gives a clean separation between:

- **Actions**: describe _what happened_ ("user clicked login", "API returned success")
- **Reducers**: _pure functions_ that compute the next state from the current state + an action (no side effects)
- **Effects**: handle _side effects_ (API calls, navigation, localStorage) and dispatch new actions when done
- **Selectors**: derive computed state from the store (memoized)
- **Services**: middle layer between components and the store -- components call service methods, services dispatch actions

This separation is the core benefit: reducers are pure and predictable, effects handle the messy async world, and the two never mix.

#### The Flow

```
Component                  Service                   Store
    |                         |                         |
    |-- calls login() ------->|                         |
    |                         |-- dispatch(login) ----->|
    |                         |                         |-- reducer sets loading=true
    |                         |                         |-- effect catches login action
    |                         |                         |     calls HTTP API
    |                         |                         |     on success: dispatch(loginSuccess)
    |                         |                         |     on error: dispatch(loginFailure)
    |                         |                         |
    |                         |                         |-- reducer sets loading=false, user=data
    |                         |                         |     (or error=message)
    |<-- signal updates UI ---|-------------------------|
```

Components never dispatch actions directly. They call service methods. This keeps components simple and makes it easy to reuse logic across components.

#### Setup

```bash
cd frontend
npm install @ngrx/store @ngrx/effects @ngrx/store-devtools
```

Register the store in `app.config.ts`:

```typescript
// app.config.ts
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { authReducer } from './core/auth/auth.reducer';
import { AuthEffects } from './core/auth/auth.effects';
import { isDevMode } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ auth: authReducer }),
    provideEffects(AuthEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ]
};
```

Angular's `isDevMode()` returns `true` when the app is served with `ng serve` (development) and `false` when built with `ng build --configuration=production`. The production build enables Angular's production mode, which makes `isDevMode()` return `false`.

With `logOnly: !isDevMode()`:
- **Development**: Full DevTools -- time-travel debugging, action log, state inspection, import/export.
- **Production**: The DevTools extension is completely disabled at the provider level.

Alternatively, you can conditionally include the provider entirely so the DevTools code is tree-shaken out of the production bundle:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ auth: authReducer }),
    provideEffects(AuthEffects),
    ...(isDevMode() ? [provideStoreDevtools({ maxAge: 25 })] : []),
  ]
};
```

This second approach is slightly better because the `@ngrx/store-devtools` code is not included in the production JavaScript bundle at all, reducing the download size by a few KB.

#### Actions (What Happened)

Actions are simple objects that describe events. They carry no logic. Think of them as a log of "things that happened in the application":

```typescript
// core/auth/auth.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // Triggered by the service when the user submits the login form
    'Login': props<{ username: string; password: string }>(),
    // Triggered by the effect when the API call succeeds
    'Login Success': props<{ user: User }>(),
    // Triggered by the effect when the API call fails
    'Login Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),

    'Check Session': emptyProps(),
    'Check Session Success': props<{ user: User }>(),
    'Check Session Failure': emptyProps(),

    'Clear Error': emptyProps(),
  },
});
```

`createActionGroup` generates typed action creators. `AuthActions.login({ username, password })` creates the action object. `AuthActions.loginSuccess({ user })` creates the success action. These are just data -- no logic, no side effects.

#### Reducer (Pure State Transitions)

The reducer is a pure function. Given the current state and an action, it returns the next state. No API calls, no subscriptions, no async -- just data in, data out:

```typescript
// core/auth/auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  // LOGIN: set loading, clear previous error
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  // LOGIN SUCCESS: store user, clear loading
  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),

  // LOGIN FAILURE: store error, clear loading
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
  })),

  on(AuthActions.checkSession, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.checkSessionSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),

  on(AuthActions.checkSessionFailure, (state) => ({
    ...state,
    user: null,
    loading: false,
  })),

  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
);
```

Each `on()` handles one action and returns a new state object. The spread operator (`...state`) copies existing state and overrides only the fields that change. This is immutable -- the old state object is never modified.

#### Effects (Side Effects)

Effects listen for specific actions, perform async work (API calls), and dispatch new actions based on the result. They never touch the state directly:

```typescript
// core/auth/auth.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthActions } from './auth.actions';
import { AuthApiService } from './auth-api.service';
import { catchError, map, switchMap, of, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authApi = inject(AuthApiService);
  private router = inject(Router);

  // When login action is dispatched -> call API -> dispatch success or failure
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ username, password }) =>
        this.authApi.login(username, password).pipe(
          map(user => AuthActions.loginSuccess({ user })),
          catchError(() => of(AuthActions.loginFailure({ error: 'Invalid credentials' })))
        )
      )
    )
  );

  // On login success -> navigate to dashboard
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => this.router.navigate(['/dashboard']))
    ),
    { dispatch: false }   // This effect doesn't dispatch a new action
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authApi.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))  // Logout locally even if API fails
        )
      )
    )
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => this.router.navigate(['/login']))
    ),
    { dispatch: false }
  );

  checkSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkSession),
      switchMap(() =>
        this.authApi.getCurrentUser().pipe(
          map(user => AuthActions.checkSessionSuccess({ user })),
          catchError(() => of(AuthActions.checkSessionFailure()))
        )
      )
    )
  );
}
```

Notice the clean separation: the effect for `login` knows nothing about what `loading: true` means. It just listens for the `login` action, calls the API, and dispatches either `loginSuccess` or `loginFailure`. The reducer handles the state changes for each of these. No mixing.

`{ dispatch: false }` marks effects that perform navigation or other side effects without dispatching a follow-up action.

#### Selectors (Derived State with Signals)

Selectors extract and derive state. Using `selectSignal` (NgRx 17+) exposes them as Angular signals for use in templates:

```typescript
// core/auth/auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);
export const selectIsLoggedIn = createSelector(selectAuthState, (state) => state.user !== null);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
```

#### API Service (HTTP Layer)

A dedicated API service handles raw HTTP calls. This is the only place `HttpClient` is used for auth. Effects call this service, not `HttpClient` directly:

```typescript
// core/auth/auth-api.service.ts
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/login', { username, password });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/auth/me');
  }
}
```

#### Components Interact with the Store Directly

With the full NgRx Store in place, components can dispatch actions and select state directly -- no facade service required for simple cases. Components inject `Store`, use `selectSignal` for reading state, and call `store.dispatch()` for actions:

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    @if (isLoggedIn()) {
      <h1>Welcome, {{ user()?.username }}</h1>
      <button (click)="onLogout()">Logout</button>
    }
  `,
})
export class DashboardComponent {
  private store = inject(Store);

  // Select state as signals -- reactively update the template
  user = this.store.selectSignal(selectCurrentUser);
  isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
```

This is clean and direct. The component knows about `AuthActions` and selectors, but that's fine -- NgRx actions and selectors are designed to be the public API of a feature's state.

#### When to Use a Service

Services are **not** needed as a mandatory middle layer. Use a service only when:

- **Complex orchestration**: Logic that dispatches multiple actions in sequence, or needs conditional branching before dispatching (e.g., "check if user exists, then register, then auto-login").
- **Shared across components**: Multiple components need the same multi-step logic. Instead of duplicating it, extract it into a service.
- **Easier unit testing**: If a piece of logic is complex enough that you want to test it in isolation (without spinning up a component), a service gives you a clean boundary.

For straightforward dispatch-and-select, components go directly to the store. For complex orchestration, create a service:

```typescript
// core/auth/auth.service.ts -- only created when complexity warrants it
@Injectable({ providedIn: 'root' })
export class AuthService {
  private store = inject(Store);

  /**
   * Complex orchestration example: register a new user, then
   * automatically log them in. This involves coordinating two
   * dispatches and waiting for the first to complete.
   */
  registerAndLogin(username: string, email: string, password: string): void {
    // This kind of multi-step logic belongs in a service, not a component
    this.store.dispatch(AuthActions.register({ username, email, password }));
    // The effect handles the chain: register -> registerSuccess -> auto-login
  }
}
```

#### Store Organization Per Feature

```
frontend/src/app/
  core/
    auth/
      auth.actions.ts          # Action definitions
      auth.reducer.ts          # Pure state transitions
      auth.effects.ts          # Side effects (API calls, navigation)
      auth.selectors.ts        # Derived state queries
      auth-api.service.ts      # Raw HTTP calls (used by effects)
      auth.service.ts          # OPTIONAL: only for complex shared orchestration
      auth.guard.ts            # Route guard (uses Store directly)
      auth.interceptor.ts      # HTTP interceptor
```

Each feature follows the same pattern: actions, reducer, effects, selectors, API service. A facade service is added only when there is complex logic worth extracting from components.

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
V2__add_avatar_url_to_users.sql
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

### Authentication Strategy: Session-Based Auth

We use **session-based authentication**: the server stores session data (in Valkey), and the browser stores a session cookie. The session cookie is an opaque, random ID -- it contains no user data. All session state lives server-side.

### Session Storage: Valkey in All Environments

Sessions are stored in **Valkey** in both development and production. Valkey is the open-source fork of Redis, created by the Linux Foundation after Redis switched to a proprietary license (SSPL) in March 2024. Valkey is fully wire-compatible with Redis -- it speaks the exact same protocol, uses the same port (6379), and works with the same client libraries. Spring's `spring-session-data-redis` and `spring-boot-starter-data-redis` connect to Valkey without any code changes because they use the Redis protocol, not the Redis brand.

Valkey is the most stable open-source choice right now:
- **Backed by the Linux Foundation** with contributors from AWS, Google, Oracle, Ericsson, and others.
- **Direct continuation of Redis 7.2** codebase -- battle-tested, not a rewrite.
- **Same API, same commands, same data structures** -- every Redis tutorial, StackOverflow answer, and library works unchanged.
- **Active development** -- Valkey 8.0 added major performance improvements and is the default key-value store in AWS ElastiCache.

(KeyDB is another fork worth knowing about, but it has a smaller community and less corporate backing. Valkey is the safer long-term bet.)

```yaml
# Add to docker-compose.yml (alongside the existing db service)
services:
  db:
    # ... (existing PostgreSQL config)

  valkey:
    image: valkey/valkey:8-alpine
    container_name: fantabet-valkey
    ports:
      - "6379:6379"
    restart: unless-stopped
```

Spring Boot configuration in `application.yml`:

```yaml
spring:
  session:
    store-type: redis                  # Spring calls it "redis" but it's just the protocol
  data:
    redis:
      host: localhost                  # 'valkey' in docker-compose prod, 'localhost' in dev
      port: 6379
```

The config still says `redis` because Spring's libraries target the Redis protocol, and Valkey implements that same protocol. There is no `store-type: valkey` -- you just point the Redis client at a Valkey server and everything works.

With `spring-session-data-redis` on the classpath (added in section 3) and this config, Spring Session automatically serializes the `SecurityContext` into Valkey when a session is created. On every subsequent request, it reads the session from Valkey using the session ID from the cookie.

Benefits of using Valkey everywhere:
- **Dev/prod parity**: No "it works on my machine" issues with session behavior.
- **Sessions survive backend restarts**: When you restart Spring Boot during development (e.g., after code changes with DevTools), your sessions stay alive in Valkey. You don't get logged out.
- **Ready for scaling**: If you ever add a second backend instance, sessions are already shared via Valkey. No code changes needed.
- **Fully open source**: No licensing concerns, no dual-license gotchas.

### How Session-Based Auth Works (Step by Step)

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
1. Creates a new `HttpSession` on the server (stored in Valkey)
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
GET /api/users/me
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

### Angular Auth in Components (Using NgRx Store Directly)

Components dispatch actions and select state directly from the store. On app startup, dispatch `checkSession` to restore an existing session.

The best place to do this is via an **`APP_INITIALIZER`** rather than `AppComponent.ngOnInit`. `APP_INITIALIZER` runs before the application renders anything, which means Angular waits for the session check to complete before showing any UI. This avoids the flash where a protected page briefly appears before the guard redirects to login (because the store hasn't loaded the user yet).

In Angular 19+, the old `APP_INITIALIZER` token is deprecated. Use `provideAppInitializer` instead -- it's simpler (no `multi: true`, no `useFactory` wrapper) and supports `inject()` directly in the callback:

```typescript
// app.config.ts (add to providers array)
provideAppInitializer(() => {
  const store = inject(Store);
  const actions$ = inject(Actions);

  store.dispatch(AuthActions.checkSession());
  // Wait until checkSession completes (success or failure) before rendering
  return firstValueFrom(
    actions$.pipe(
      ofType(AuthActions.checkSessionSuccess, AuthActions.checkSessionFailure),
      take(1)
    )
  );
})
```

How this works:
1. Before Angular renders the root component, the initializer dispatches `checkSession`.
2. The effect calls `GET /api/auth/me`.
3. The initializer waits (via `firstValueFrom`) until either `checkSessionSuccess` or `checkSessionFailure` is dispatched.
4. Only then does Angular proceed with rendering. The store now knows whether the user is authenticated, so route guards work correctly from the first navigation.

`provideAppInitializer` accepts a function that can return a `Promise` or `Observable`. Angular waits for it to resolve before bootstrapping. The `inject()` calls work because the function runs in an injection context.

If you prefer a simpler approach that doesn't block rendering (and you're okay with a brief loading flash), dispatching from `AppComponent.ngOnInit` also works:

```typescript
@Component({ selector: 'app-root', ... })
export class AppComponent implements OnInit {
  private store = inject(Store);

  ngOnInit(): void {
    this.store.dispatch(AuthActions.checkSession());
  }
}
```

This second approach is simpler but the guard might redirect to `/login` before the session check finishes, causing a flicker. The `APP_INITIALIZER` approach avoids this entirely.

The login component dispatches actions and reads state signals directly:

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onLogin()">
      <input formControlName="username" placeholder="Username" />
      <input formControlName="password" type="password" placeholder="Password" />
      <button type="submit" [disabled]="loading()">Login</button>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </form>
  `,
})
export class LoginComponent {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  onLogin(): void {
    const { username, password } = this.form.value;
    if (username && password) {
      this.store.dispatch(AuthActions.login({ username, password }));
    }
  }
}
```

### Angular HTTP Interceptor (Credentials)

Since both frontend and backend are same-origin, the browser sends cookies automatically. However, `withCredentials: true` is still set as a safety net. The interceptor dispatches a logout action directly to the store on unexpected 401 responses:

```typescript
// core/auth/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  const authReq = req.clone({ withCredentials: true });
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        // Session expired or invalid -- log out locally
        store.dispatch(AuthActions.logout());
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
    provideStore({ auth: authReducer }),
    provideEffects(AuthEffects),
    provideStoreDevtools({ maxAge: 25 }),
  ]
};
```

### Angular Route Guard (Using Store Directly)

The guard selects `isLoggedIn` from the store:

```typescript
// core/auth/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  if (store.selectSignal(selectIsLoggedIn)()) {
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

/api/users/{id}          GET     Get user profile
/api/users/{id}          PUT     Update user profile
```

### HTTP Response Conventions

Spring Boot controllers should return consistent JSON structures:

**Success:**
```json
{
  "username": "cicciofrizzo",
  "roles": ["USER"]
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

Angular's `HttpClient` is the tool for making HTTP requests. It returns RxJS `Observable`s. The `AuthApiService` shown in section 6 is the primary example of how to use `HttpClient` in this project. All API services follow the same pattern: inject `HttpClient`, return `Observable`s, use relative URLs.

Note that the URLs are relative (no `http://localhost:8080`). In development, the Angular proxy forwards them to Spring Boot. In production, they resolve to the same server since Angular's built files are served by Spring Boot.

### TypeScript Models (Matching Backend DTOs)

```typescript
// shared/models/user.model.ts
export interface User {
  username: string;
  roles: string[];
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

| Tool                    | Purpose                         | Install                                            |
|-------------------------|---------------------------------|----------------------------------------------------|
| JDK 21                  | Run Spring Boot                 | `brew install openjdk@21`                          |
| Maven (via wrapper)     | Build backend                   | Already in project (`mvnw`)                        |
| Node.js 20+             | Run Angular tooling             | `brew install node`                                |
| npm                     | Manage JS dependencies          | Comes with Node.js                                 |
| Angular CLI             | Scaffold and manage Angular     | `npm install -g @angular/cli`                      |
| angular-eslint          | Lint TypeScript and templates   | `ng add @angular-eslint/schematics`                |
| Vitest                  | Frontend unit testing           | Ships with Angular 21 (`@angular/build:unit-test`) |
| Docker & Docker Compose | Run PostgreSQL + Valkey locally | `brew install --cask docker`                       |
| IntelliJ IDEA           | IDE for Kotlin + Angular        | Already in use                                     |

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

### Code Formatting with Prettier

Prettier handles code formatting (indentation, line length, quotes, trailing commas) while ESLint handles code quality (unused variables, wrong imports, Angular-specific rules). The two complement each other without overlap when configured correctly.

**Setup** (from `frontend/` directory):

```bash
# Install Prettier and the ESLint integration
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

What each package does:
- **`prettier`**: The formatter itself
- **`eslint-config-prettier`**: Turns off all ESLint rules that conflict with Prettier (spacing, quotes, semicolons, etc.)
- **`eslint-plugin-prettier`**: Runs Prettier as an ESLint rule so formatting issues show up as lint errors

Create `frontend/.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 4,
  "semi": true
}
```

Update `eslint.config.js` to integrate Prettier (add at the end of the config array):

```javascript
// Add to the existing eslint.config.js generated by angular-eslint
const eslintPluginPrettier = require('eslint-plugin-prettier/recommended');

module.exports = [
  // ... existing angular-eslint config entries ...
  eslintPluginPrettier,   // Must be last so it overrides conflicting rules
];
```

Now `ng lint --fix` both fixes code quality issues AND formats code. You can also run Prettier directly:

```bash
# Format all files
npx prettier --write "src/**/*.{ts,html,scss,json}"

# Check formatting without modifying (useful in CI)
npx prettier --check "src/**/*.{ts,html,scss,json}"
```

Add a format script to `frontend/package.json`:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\""
  }
}
```

If you use IntelliJ IDEA, enable both the ESLint and Prettier integrations in Settings > Languages & Frameworks. IntelliJ can run Prettier on save (Settings > Languages & Frameworks > JavaScript > Prettier > Run on save).

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

   **Why is this needed if the Maven build includes the frontend?** The Maven frontend plugin is for _production builds_ -- it compiles Angular once and bundles the output into the JAR. But during development you want **live reload**: every time you save a TypeScript or HTML file, the browser refreshes instantly (in ~200ms). The Maven build takes 30+ seconds for a full recompile, which would destroy the feedback loop. So the workflow is:
   - **Daily development**: `ng serve` (fast, live reload, proxied to Spring Boot)
   - **Production / CI / Docker**: `./mvnw package` (one command builds everything into a JAR)

4. **Develop:** Edit Kotlin files and the backend auto-restarts (Spring DevTools). Edit Angular files and the browser auto-refreshes (via `ng serve` HMR).

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

**Unit tests** (for services): Use JUnit 5 + MockK (the idiomatic Kotlin mocking library). Test business logic in isolation by mocking repository interfaces.

Add MockK to `pom.xml` (this is a third-party library not managed by Spring Boot, so it **needs an explicit version**):

```xml
<dependency>
    <groupId>io.mockk</groupId>
    <artifactId>mockk-jvm</artifactId>
    <version>1.13.16</version>
    <scope>test</scope>
</dependency>
```

MockK is preferred over Mockito for Kotlin because it natively supports Kotlin features like extension functions, coroutines, companion objects, and `val` properties. The syntax (`every { ... } returns ...`, `verify { ... }`) reads naturally in Kotlin.

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
        mockMvc.get("/api/auth/me").andExpect {
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

### Frontend Testing with Vitest

Angular 21 ships with **Vitest** as the built-in test runner via `@angular/build:unit-test`. No additional setup is
needed -- `ng new` scaffolds everything automatically, including `vitest/globals` types in `tsconfig.spec.json`.

Vitest runs tests in a jsdom environment without a browser, supports watch mode, and is significantly faster than the
old Karma + Jasmine setup. It uses the same `describe`, `it`, `expect` API. Angular's `TestBed` and
`HttpTestingController` work unchanged.

**Running tests:**

```bash
npm test                # Single run
npm run test:watch      # Watch mode (re-runs on file changes)
npm run test:coverage   # With coverage report
```

The `angular.json` test target is already configured:

```json
"test": {
"builder": "@angular/build:unit-test"
}
```

**Example test** (using `TestBed` and `HttpTestingController`):

```typescript
describe('AuthApiService', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should call login endpoint', () => {
    const mockUser = { username: 'cicciofrizzo', roles: ['USER'] };

    http.post('/api/auth/login', { username: 'cicciofrizzo', password: 'Adamo123' })
      .subscribe(user => {
        expect(user).toEqual(mockUser);
      });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockUser);
  });
});
```

Vitest provides `vi.fn()` and `vi.spyOn()` for mocking (instead of Jest's `jest.fn()`). The `vi` global is available
automatically via the `vitest/globals` types.

### Testing Strategy: No E2E for Now

The testing approach focuses on two layers:

- **Frontend unit tests (Vitest)**: Test core logic in Angular services, guards, and interceptors. Mock HTTP calls with
  `HttpTestingController`. Fast, reliable, easy to maintain.
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
      SPRING_DATA_REDIS_HOST: valkey
    depends_on:
      - db
      - valkey
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

  valkey:
    image: valkey/valkey:8-alpine
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

#### Initial Droplet Setup (One Time)

On a fresh DigitalOcean droplet (Ubuntu 24.04 recommended):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install docker-compose-plugin

# Create the app directory
mkdir -p /opt/fantabet
cd /opt/fantabet

# Create the .env file with secrets
cat > .env << 'EOF'
DB_PASSWORD=your-secure-password-here
EOF
chmod 600 .env
```

You also need to create the `docker-compose.prod.yml` and `Caddyfile` on the droplet (or they can be part of the repo and pulled via git).

#### Automated Deployment with GitHub Actions

Instead of manually SSH-ing into the droplet to pull and rebuild, set up a GitHub Action that deploys automatically when you push to `main`.

The approach: the GitHub Action SSHs into the droplet, pulls the latest code, and rebuilds the Docker containers.

**Step 1: Add a deploy SSH key**

Generate a dedicated SSH key pair for deployment:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "fantabet-deploy" -f fantabet-deploy-key
# Don't set a passphrase (the CI needs to use it non-interactively)
```

Add the **public** key to the droplet's `~/.ssh/authorized_keys`. Add the **private** key as a GitHub Actions secret named `DEPLOY_SSH_KEY`. Also add secrets for `DEPLOY_HOST` (the droplet's IP) and `DEPLOY_USER` (e.g., `root` or a dedicated deploy user).

**Step 2: Create the workflow file**

```yaml
# .github/workflows/deploy.yml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/fantabet
            # Pull latest code
            git pull origin main
            # Rebuild and restart containers (only rebuilds what changed)
            docker compose -f docker-compose.prod.yml up -d --build
            # Clean up old images to save disk space
            docker image prune -f
```

This uses the `appleboy/ssh-action` which is the most popular GitHub Action for SSH commands. It connects to the droplet, pulls the latest code, and rebuilds the containers.

The full flow:
```
Push to main -> GitHub Action triggers -> SSH into droplet -> git pull -> docker compose up --build
```

**Step 3 (optional): Add a build-and-test job first**

You can add a preceding job that runs tests before deploying:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'corretto'

      - name: Run backend tests
        run: ./mvnw test

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run frontend tests
        run: cd frontend && npm ci && npm test

  deploy:
    needs: test                    # Only deploy if tests pass
    runs-on: ubuntu-latest
    # ... (same as above)
```

#### Centralized Logging with Dozzle

For reading container logs from a web browser, **Dozzle** is a lightweight, real-time log viewer for Docker. It is a single container with no database, no agents, and no configuration -- it reads directly from Docker's log stream.

Add it to `docker-compose.prod.yml`:

```yaml
services:
  # ... (existing app, db, valkey, caddy services)

  dozzle:
    image: amir20/dozzle:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro    # Read-only access to Docker
    ports:
      - "127.0.0.1:8888:8080"                           # Only accessible locally, not from internet
    environment:
      DOZZLE_USERNAME: admin                             # Basic auth
      DOZZLE_PASSWORD: ${DOZZLE_PASSWORD}                # Add to .env file
    restart: unless-stopped
```

Key details:
- **`127.0.0.1:8888:8080`**: Dozzle is bound to localhost only, so it's not exposed to the internet. You access it via SSH tunnel.
- The Docker socket is mounted read-only so Dozzle can read logs but cannot start/stop/modify containers.

**Accessing Dozzle from your machine:**

```bash
# Open an SSH tunnel from your machine to the droplet
ssh -L 8888:localhost:8888 root@your-droplet-ip

# Then open http://localhost:8888 in your browser
```

This gives you a real-time web UI showing logs from all containers (app, db, valkey, caddy) with filtering, search, and color-coded output. No log files to manage, no external services, no costs.

#### Structured Application Logging

To make the logs more useful, configure Spring Boot to output structured JSON logs (easier to search and filter):

In `application-prod.yml`:

```yaml
logging:
  structured:
    format:
      console: logfmt                  # Structured log format (key=value pairs)
  level:
    root: INFO
    com.fantabet: DEBUG                # More verbose logging for our code
    org.springframework.security: INFO
```

This outputs logs like:
```
timestamp=2026-03-12T10:00:00Z level=INFO logger=com.fantabet.fantabet.controller.AuthController message="User logged in" username=cicciofrizzo
```

Which is much easier to search in Dozzle than unstructured text.

### Unified Build with Maven Frontend Plugin

The `frontend-maven-plugin` integrates the Angular build into Maven so that a single `./mvnw package` command builds both the frontend and backend into one deployable JAR. This is the standard approach for the project -- all builds go through Maven.

The plugin works by:
1. Downloading and installing a local copy of Node.js and npm into the project (in `frontend/node/`). This means **the CI server and the Dockerfile don't need Node.js pre-installed** -- Maven handles it.
2. Running `npm ci` to install frontend dependencies.
3. Running the Angular production build.
4. The `maven-resources-plugin` then copies the Angular output into `target/classes/static/`, where Spring Boot picks it up as static resources.

Add both plugins to the `<build><plugins>` section of `pom.xml`:

```xml
<!-- 1. Build Angular via Maven -->
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.15.1</version>
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

<!-- 2. Copy Angular build output into Spring Boot's static resources -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-frontend</id>
            <phase>generate-resources</phase>
            <goals><goal>copy-resources</goal></goals>
            <configuration>
                <outputDirectory>${project.build.directory}/classes/static</outputDirectory>
                <resources>
                    <resource>
                        <directory>frontend/dist/frontend/browser</directory>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

Now the complete build is a single command:

```bash
# Build everything: install Node, install npm deps, build Angular, compile Kotlin, package JAR
./mvnw clean package

# The resulting JAR includes Angular's files in /static and is fully self-contained
java -jar target/fantabet-0.0.1-SNAPSHOT.jar
```

This also simplifies the Dockerfile since you don't need a separate Node.js build stage:

```dockerfile
# Stage 1: Build everything with Maven (it handles Node.js internally)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src/ src/
COPY frontend/ frontend/
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=build /app/target/fantabet-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

For daily development you still run `ng serve` separately (with the proxy) for live reload. The Maven-integrated build is for CI, Docker, and production packaging.

Add `frontend/node/` and `frontend/node_modules/` to `.gitignore` to keep the downloaded Node.js and dependencies out of version control.

---

## Summary of Key Decisions

| Decision              | Choice                                                 | Rationale                                                          |
|-----------------------|--------------------------------------------------------|--------------------------------------------------------------------|
| Architecture          | Decoupled SPA (Angular) + REST API (Spring Boot)       | Clear separation, better UX, independent development               |
| State management      | NgRx Store + Effects + Signals                         | Actions/reducers/effects separation, predictable, DevTools support |
| Auth mechanism        | Server-side sessions with HttpOnly cookies             | Simple, secure, easily revocable                                   |
| CSRF protection       | SameSite=Lax cookie attribute (no CSRF tokens)         | Sufficient for SPA + JSON API; simpler than synchronizer tokens    |
| CORS                  | Not needed (same origin)                               | FE and BE both served from same domain                             |
| Password hashing      | Argon2 (already in place)                              | Best current algorithm for password hashing                        |
| Database              | PostgreSQL                                             | Robust, free, excellent JPA support                                |
| Session store         | Valkey in all environments (dev + prod)                | Open source, dev/prod parity, survives restarts                    |
| Schema management     | Flyway versioned migrations                            | Reproducible, auditable schema history                             |
| Build system          | Maven with frontend-maven-plugin                       | Single `mvnw package` builds FE + BE into one JAR                  |
| Dev proxy             | Angular `proxy.conf.json` forwarding `/api` to `:8080` | Avoids CORS in development, zero config                            |
| Production deployment | DigitalOcean droplet, Caddy reverse proxy              | Simple, cheap, automatic HTTPS via Let's Encrypt                   |
| CI/CD                 | GitHub Actions SSH deploy on push to main              | Automated, tests before deploy                                     |
| Logging               | Dozzle (web UI) + structured logfmt output             | Zero-config log viewer, easy to search                             |
| Container runtime     | Amazon Corretto 21 Alpine                              | AWS-backed, long-term support, small image                         |
| Frontend linting      | angular-eslint + Prettier                              | ESLint for quality, Prettier for formatting                        |
| Frontend testing      | Vitest (Angular 21 built-in)                           | Fast, no browser needed, ships with Angular                        |
| Backend testing       | JUnit 5 + MockK + MockMvc                              | Unit tests for services, integration tests for API                 |
| ORM                   | JPA/Hibernate via Spring Data                          | Standard, well-documented, Kotlin-compatible with plugins          |

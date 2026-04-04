# Profile & Application Flow Design

Design specification for the application navigation flow, profile page as league hub, and league management modal. Updates routing, state management, and page layouts for the world-cup-predictor.

**Key decisions:**
- Profile page is the league hub — full-width, no sidebar, minimal header
- Dashboard is always league-scoped with a slug in the URL
- Current league stored in `localStorage`, rehydrated into NGRx on app init
- Server session stays lean (auth identity only)
- Route-level guards with focused responsibilities (Approach A)
- Invitation token resolution deferred to separate spec — only interface boundary defined here

---

## 1. Route Structure & Guards

### 1.1 Routes

| Path | Component | Guards | Layout |
|------|-----------|--------|--------|
| `/` | LandingComponent | none | Public (full-width, sticky nav with auth links) |
| `/login` | LoginComponent | none | Public |
| `/register` | RegisterComponent | none | Public |
| `/profile` | ProfileComponent | `authGuard` | Profile (full-width, minimal header: logo + logout) |
| `/dashboard` | LeagueResolverComponent | `authGuard`, `leagueResolverGuard` | n/a (always redirects) |
| `/dashboard/:leagueSlug` | DashboardComponent | `authGuard`, `leagueMemberGuard` | Dashboard (sidebar + header with league indicator) |
| `/create-league` | CreateLeagueComponent | `authGuard` | Profile layout |
| `**` | NotFoundComponent | none | Minimal |

### 1.2 Guards

**`authGuard`** (existing) — checks `/api/auth/me`, redirects to `/login` if unauthenticated.

**`leagueResolverGuard`** (new) — applied to bare `/dashboard` route. Reads `localStorage('currentLeague')`. If a slug is found, redirects to `/dashboard/:slug` (the `leagueMemberGuard` on that route will handle membership validation). If no slug is found, redirects to `/profile`. This route never renders a component.

**`leagueMemberGuard`** (new) — applied to `/dashboard/:leagueSlug`. Calls backend to verify the current user is a member (Member or Admin) of the league identified by the slug. Returns `true` if authorized. Returns `UrlTree` to 404 page if the league doesn't exist or the user is not a member. This prevents information leakage — unauthorized users see the same 404 whether the league exists or not.

### 1.3 Post-Auth Redirect Logic

In `AuthEffects`, after `loginSucceeded` or `registrationSucceeded`:

1. Check for invitation token in route query params (`?invite=TOKEN`)
   - If present: POST to `/api/leagues/join` with the token, then navigate to `/profile` (league appears as Pending)
2. Read `localStorage('currentLeague')`
   - If slug found: navigate to `/dashboard/:slug`
   - If not found: navigate to `/profile`

---

## 2. Page Layouts

Three distinct layout contexts:

### 2.1 Public Layout
Used by: Landing, Login, Register.
- Full-width
- Sticky navigation bar with logo + auth links (Login / Sign Up)
- No sidebar, no auth required

### 2.2 Profile Layout
Used by: Profile, Create League.
- Full-width, no sidebar
- Minimal header: logo + user email + logout button
- Auth required

### 2.3 Dashboard Layout
Used by: All league-scoped pages (dashboard, predictions, ranking, winners, rules).
- Sidebar navigation (Dashboard, My Predictions, Full Ranking, Past Winners, Rules)
- Header with **league indicator**: current league name badge + "Change" link back to `/profile`
- Auth required, league membership required

---

## 3. Profile Page

Full-width page with minimal header. Serves as the league hub — the central place to manage league memberships and personal settings.

### 3.1 Sections

**My Leagues** (top of page, primary content):
- Full-width league cards, stacked vertically
- Each card shows: league name, tournament, member count, membership status badge
- Status badges: **Admin** (navy), **Member** (blue), **Pending** (amber)
- Admin cards: "Enter" button + "Edit" button (opens League Edit Modal)
- Member cards: "Enter" button only
- Pending cards: dimmed appearance, no Enter button, "Awaiting owner approval" text
- "Create League" button in the section header
- Clicking "Enter" sets `localStorage('currentLeague')` to the league slug and navigates to `/dashboard/:leagueSlug`

**Personal Information:**
- Username and email fields with Save button
- Grid layout (2 columns on desktop)

**Change Password:**
- Current password, new password, confirm password fields
- Grid layout (3 columns on desktop)

### 3.2 Not Included on Profile

- **Account stats** (total points, predictions, accuracy) — these are league-scoped and belong on the dashboard, not the profile

---

## 4. League Edit Modal

Admin-only modal opened from the Edit button on a league card. Two tabs.

### 4.1 Tab: League Info

League settings and invitation tools in a single tab:

**Settings:**
- League name (editable input)
- Tournament (read-only after creation)
- Prediction type (radio: Results Only / Results + Scorers)
- Timeframe rule (radio: Open by Default / 24-Hour Window)

**Invitations:**
- Shareable invitation link with copy button
- Invite by email input with send button

- Save Changes button at bottom

### 4.2 Tab: Members & Requests

**Pending Requests** (shown at top, amber background):
- List of users who requested to join
- Each row shows: username, email, Accept button (green), Reject button (red)
- Count shown in section header: "Pending Requests (N)"

**Members** (below pending requests):
- List of current members
- Each row shows: username, role badge (Admin / Member)
- Count shown in section header: "Members (N)"

---

## 5. State Management

### 5.1 New NGRx State: `league`

```
interface LeagueState {
  leagues: LeagueWithMembership[];  // user's leagues with status
  currentLeagueSlug: string | null; // synced with localStorage
  loading: boolean;
  error: string | null;
}

interface LeagueWithMembership {
  slug: string;
  name: string;
  tournament: string;
  memberCount: number;
  role: 'ADMIN' | 'MEMBER' | 'PENDING';
}
```

**Actions:** `leaguesLoadStarted`, `leaguesLoaded`, `leaguesLoadFailed`, `leagueSelected`, `leagueDeselected`

**Effects:**
- `leagueSelected` → writes slug to `localStorage('currentLeague')`, navigates to `/dashboard/:slug`
- `leagueDeselected` → removes `currentLeague` from `localStorage`, navigates to `/profile`

**Selectors:** `selectLeagues`, `selectCurrentLeagueSlug`, `selectCurrentLeague`, `selectLeaguesByRole`

### 5.2 New NGRx State: `leagueAdmin`

```
interface LeagueAdminState {
  members: Member[];
  pendingRequests: JoinRequest[];
  loading: boolean;
  error: string | null;
}
```

**Actions:** `membersLoadStarted`, `membersLoaded`, `requestApproved`, `requestRejected`, `inviteSent`

**Effects:**
- `requestApproved` / `requestRejected` → API call, then reload members list
- `inviteSent` → API call to send email invitation

### 5.3 Updated App Initialization

The existing `initUser()` app initializer is extended:

1. Call `/api/auth/me` — if authenticated, dispatch `userSessionCheckSucceeded`
2. On auth success, load user's leagues via `/api/leagues/mine` → dispatch `leaguesLoaded`
3. Read `localStorage('currentLeague')` — if present and user is still a member of that league, dispatch `leagueSelected` (without triggering navigation, since the router handles it)

### 5.4 localStorage Strategy

- Key: `currentLeague`
- Value: league slug string (e.g. `"family-ciao-league"`)
- Written on: league selection from profile
- Cleared on: logout, or when user clicks "Change" from dashboard header
- Read on: app init (rehydration), post-login redirect, bare `/dashboard` route resolution
- No sensitive data — purely a UX convenience for remembering last league context

---

## 6. API Endpoints

Backend endpoints needed for this feature set:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/leagues/mine` | Required | User's leagues with membership status |
| `GET` | `/api/leagues/:slug` | Member | League detail |
| `POST` | `/api/leagues` | Required | Create new league |
| `PUT` | `/api/leagues/:slug` | Admin | Update league settings |
| `GET` | `/api/leagues/:slug/members` | Admin | Members + pending requests |
| `POST` | `/api/leagues/:slug/invite` | Admin | Send email invitation |
| `POST` | `/api/leagues/:slug/members/:id/approve` | Admin | Approve join request |
| `DELETE` | `/api/leagues/:slug/members/:id` | Admin | Reject join request |
| `GET` | `/api/leagues/:slug/membership` | Required | Check if current user is a member (used by `leagueMemberGuard`) |

### 6.1 Invitation Interface Boundary

Two entry points for invitations, both carrying a token:

1. **Email link** — system sends email with a link containing an invitation token
2. **Shared link** — admin copies a shareable link from the League Edit Modal

Both resolve to the same flow:
- Link lands user on `/register?invite=TOKEN` (or `/login?invite=TOKEN`)
- After authentication, the app POSTs to `/api/leagues/join` with the token
- Backend resolves the token to a league, creates a Pending membership
- User is redirected to `/profile` where the league appears with Pending status
- Owner is notified (notification mechanism TBD)

**Token resolution logic, security model, and email delivery are deferred to a separate spec.** This spec only defines what the frontend does when a token is present in the URL.

---

## 7. Access Control Summary

| Scenario | Behavior |
|----------|----------|
| Unauthenticated user hits `/profile` or `/dashboard/*` | Redirect to `/login` |
| Authenticated user hits `/dashboard` (bare) | Resolve from `localStorage` → `/dashboard/:slug` or `/profile` |
| Authenticated user hits `/dashboard/:slug` they belong to | Render dashboard |
| Authenticated user hits `/dashboard/:slug` they don't belong to | 404 page |
| Authenticated user hits `/dashboard/:slug` that doesn't exist | 404 page (same as above, no leakage) |
| User with Pending membership tries to enter league | Cannot — no "Enter" button, card is dimmed |
| User logs in with `localStorage` league set | Redirect to `/dashboard/:slug` |
| User logs in without `localStorage` league | Redirect to `/profile` |
| User clears browser data and logs in | Redirect to `/profile` (no league in `localStorage`) |

---

## 8. Components Summary

### New Components
- `ProfileComponent` — full-width profile page / league hub
- `LeagueCardComponent` — reusable league card with status badge and action buttons
- `LeagueEditModalComponent` — 2-tab modal (League Info + Invitations, Members & Requests)
- `LeagueResolverComponent` — empty component for bare `/dashboard` (guard does the work)
- `NotFoundComponent` — 404 page
- `LeagueIndicatorComponent` — badge in dashboard header showing current league + "Change" link

### Modified Components
- `DashboardComponent` — add `LeagueIndicatorComponent` to header
- `AuthEffects` — update post-login/register redirect logic to check `localStorage`
- `initUser()` — extend to load leagues and rehydrate current league from `localStorage`
- `app.routes.ts` — add new routes, guards, and remove default redirect to `/dashboard`
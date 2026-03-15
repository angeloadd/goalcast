# Fantabet — Design System Definition

## 1. Product Overview

Fantabet is a World Football Cup prediction game dashboard. Users compete by predicting match outcomes and scorers across group and knockout stages. The UI must feel like a premium sports platform — dark navy tones, gold accents, clean data-heavy layouts that stay readable at a glance.

---

## 2. Pages & Layout

### 2.1 Global Shell

Every authenticated page shares a common layout:

- **Sidebar (left, always visible on desktop, collapsible on mobile)**
  - Always dark navy regardless of light/dark mode
  - Gold active indicator on current page
  - Links: Dashboard, Predictions, Ranking, Past Winners, Rules
  - Bottom section: profile avatar + username, links to Profile settings
  - On mobile: hamburger toggle, sidebar slides in as overlay

- **Main content area (right of sidebar)**
  - Page header (title + subtitle) at top
  - Content below, scrollable independently
  - Max width 1400px, centered with 2rem horizontal padding

### 2.2 Page Breakdown

#### Dashboard (Home)
The landing page after login. Provides a snapshot of everything at once.

| Section | Description |
|---------|-------------|
| **Current Ranking** | Top 5 users with rank badges (gold/silver/bronze), points, trend arrow (up/down/same vs. previous round) |
| **Your Position** | Highlighted card showing the logged-in user's rank, points, and distance to leader |
| **Next Matches** | Upcoming 3-5 matches with countdown timers. If prediction window is open, shows a quick "Predict now" CTA linking to the Predictions page |
| **Last Results** | Most recent 3-5 completed matches with actual scores, user's prediction, and points earned per match (green for correct, red for wrong, gold for exact) |
| **Tournament Status** | Mini bracket or progress indicator showing current phase (Group A-H, Round of 16, QF, SF, Final), how many matches remain |

#### Predictions
The main interaction page. Shows all matches grouped by phase/round.

| State | Display |
|-------|---------|
| **Open for prediction** | Match card is interactive — score inputs for each team, scorer dropdown per team (one scorer, own goal option, no goal option). Gold border pulse animation to draw attention. Submit button per match or bulk "Save all" |
| **Prediction submitted** | Card shows the user's prediction with a checkmark. Editable until the prediction deadline (e.g. 1h before kickoff). Muted gold border, no pulse |
| **Prediction locked** | Deadline passed but match not started. Card is read-only, shows prediction, greyed-out inputs. Muted styling |
| **Match in progress** | Live indicator (pulsing dot). Shows current real score alongside prediction. No editing |
| **Match completed** | Shows final score, user's prediction, points breakdown. Color-coded: green border for correct result, gold for exact score, red for wrong |
| **Future (not yet open)** | Visible but disabled. Shows teams, date/time, "Opens on [date]" label. Greyed card, no inputs |

**Knockout phase additions:**
- From Round of 16 onward, each match card includes a "Scorer prediction" section
- One scorer per team: dropdown of squad players + "Own Goal" option + "No Goal" option
- Scorer prediction is separate from score prediction and awards bonus points

#### Full Ranking
Complete leaderboard for all participants.

| Element | Detail |
|---------|--------|
| **Table columns** | Rank, Avatar, Username, Points, Exact Scores, Correct Results, Scorer Bonuses, Trend |
| **Top 3** | Gold/silver/bronze rank badges. Slightly larger row height |
| **Current user** | Always highlighted with accent border, even when scrolled |
| **Sorting** | Default by points (desc). Clickable column headers for secondary sorts |
| **Filtering** | Optional: filter by group/phase to see who scored most in a specific round |

#### Past Winners
Historical archive of previous tournaments/editions.

| Element | Detail |
|---------|--------|
| **Winner card** | Trophy icon, winner name + avatar, year, total points, runner-up, 3rd place |
| **Layout** | Grid of cards, one per edition. Most recent first |
| **Empty state** | If first edition: "This could be you! 🏆" placeholder (only emoji allowed here) |

#### Rules
Static content page explaining the scoring system and game mechanics.

| Section | Content |
|---------|---------|
| **Scoring table** | Points per prediction type: exact score (e.g. 3pts), correct result (e.g. 1pt), correct scorer (e.g. 2pts bonus) |
| **Prediction windows** | When predictions open and close relative to kickoff |
| **Scorer rules** | One scorer per team per match, own goal option, no goal option. Only available in knockout rounds |
| **Tiebreakers** | How ties are resolved in the ranking |
| **Format** | Clean typography, section anchors, possibly collapsible FAQ-style |

#### Profile (Settings)
Accessible from sidebar avatar/name.

| Section | Detail |
|---------|--------|
| **Profile image** | Upload/change avatar. Circular crop preview |
| **User data** | Edit username, email (with re-verification if changed) |
| **Password** | Change password form (current + new + confirm) |
| **Preferences** | Dark/light mode toggle (stored in localStorage + class on `<html>`) |

### 2.3 Unauthenticated Pages

- **Login** — Email + password form, link to register
- **Register** — Username + email + password form, link to login
- Both are centered cards on the page background, no sidebar

---

## 3. Brand & Color System

### 3.1 Identity

**Navy + Gold.** The palette is inspired by premium sports branding — think Champions League, elite club crests. Gold is the constant brand anchor across both modes. Dark mode is the "primary" experience (sports apps are typically used in the evening).

### 3.2 Semantic Palette

All colors are raw HSL channels in CSS variables, wrapped with `hsl()` at the Tailwind theme level. This enables opacity modifiers like `bg-primary/50`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | Cool off-white `220 25% 97%` | Deep navy `220 60% 8%` | Page background |
| `foreground` | Near-black navy `220 60% 10%` | Near-white `220 20% 95%` | Default text |
| `primary` | Dark navy `220 60% 15%` | Gold `45 100% 50%` | Buttons, CTAs, emphasis. **Swaps between modes** |
| `primary-foreground` | Cream `45 100% 96%` | Navy `220 60% 10%` | Text on primary surfaces |
| `secondary` | Light gray `220 20% 92%` | Dark gray `220 40% 18%` | Secondary buttons, tags |
| `accent` | Gold `45 100% 50%` | Gold `45 100% 50%` | **Always gold** — highlights, active states, focus rings |
| `muted` | `220 15% 94%` | `220 40% 15%` | Subtle backgrounds (disabled cards, empty states) |
| `muted-foreground` | `220 10% 45%` | `220 15% 60%` | Secondary text, labels, timestamps |
| `destructive` | Red `0 72% 51%` | Same | Errors, delete actions, wrong predictions |
| `success` | Green `142 76% 36%` | Same | Correct predictions, positive trends |
| `card` | White `0 0% 100%` | Dark navy `220 50% 12%` | Card surfaces |
| `border` | `220 20% 88%` | `220 40% 18%` | All borders |
| `ring` | Gold `45 100% 50%` | Same | Focus rings — always on-brand |

### 3.3 Sidebar Palette

The sidebar is always dark navy regardless of mode — a fixed dark surface with gold accents:

| Token | Light | Dark |
|-------|-------|------|
| `sidebar-background` | `220 60% 12%` | `220 60% 6%` |
| `sidebar-primary` | Gold | Gold |
| `sidebar-accent` | `220 50% 20%` | `220 50% 15%` |
| `sidebar-border` | `220 40% 20%` | `220 40% 12%` |

### 3.4 Gradients & Shadows

| Token | Value | Where |
|-------|-------|-------|
| `--gradient-gold` | `135deg, gold → darker gold` | Gold CTA buttons, rank-1 badge, prediction submit |
| `--gradient-navy` | `135deg, navy → deep navy` | Sidebar background |
| `--gradient-card` | `145deg, white → off-white` | Stat cards (light mode) |
| `--shadow-card` | Soft navy shadow, 8% opacity | Default card elevation |
| `--shadow-gold` | Gold glow, 40% opacity | Gold buttons, active prediction card |

### 3.5 Prediction-Specific Colors

These are applied contextually using existing tokens:

| State | Color | Token |
|-------|-------|-------|
| Exact score predicted | Gold highlight | `accent` |
| Correct result (wrong score) | Green | `success` |
| Wrong prediction | Red | `destructive` |
| Pending / not yet scored | Default | `muted` |
| Prediction window open | Gold border pulse | `accent` + `animate-pulse-gold` |
| Match in progress | Pulsing green dot | `success` |
| Locked / expired | Greyed out | `muted` + `opacity-50` |

---

## 4. Typography

### 4.1 Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **Body / UI** | Inter | 300–800 | All body text, labels, buttons, inputs, table data |
| **Display** | Bebas Neue | 400 | Tournament titles, hero scores, large numbers, page headers where impact is needed |

Fonts will be added to the build directly (not Google Fonts CDN).

### 4.2 Type Scale

Using Tailwind defaults (rem-based, 16px root):

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Timestamps, match kick-off times, fine print |
| `text-sm` | 14px | Table body, secondary labels, card metadata |
| `text-base` | 16px | Body text, input values, descriptions |
| `text-lg` | 18px | Card titles, section headers |
| `text-xl` | 20px | Page subtitles, stat values |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | Dashboard section headers (`.page-title`) |
| `text-4xl+` | 36px+ | Hero numbers with `.font-display` (tournament name, big scores) |

### 4.3 Heading Style

All headings use Inter bold with tight letter-spacing (`-0.025em`). This keeps headings compact and modern without needing the display font for every title.

---

## 5. Spacing & Layout

### 5.1 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` (base) | `0.75rem` (12px) | Cards, modals, large surfaces |
| `--radius-md` | `0.625rem` (10px) | Buttons, inputs, dropdowns |
| `--radius-sm` | `0.5rem` (8px) | Tags, small chips, badges |
| `9999px` (full) | Circle | Avatars, rank badges |

### 5.2 Container

Max width `1400px`, centered, `2rem` horizontal padding. Defined as `@utility container`.

### 5.3 Spacing Conventions

- Card padding: `1rem` (match cards) to `1.5rem` (stat cards)
- Section gaps: `2rem` between major sections
- Page header margin-bottom: `2rem`
- Inline element gaps: `0.5rem` (buttons with icons, badge + text)

---

## 6. Component Classes

All defined in `styles.scss` as plain CSS classes (not `@utility` — they need pseudo-selectors).

### 6.1 Buttons

| Class | Purpose | Example usage |
|-------|---------|---------------|
| `.btn` | Base — always required. Flex, rounded, 14px medium, gold focus ring | Combined with a variant |
| `.btn-default` | Primary filled (navy/gold depending on mode) | "Save prediction", "Login" |
| `.btn-destructive` | Red filled | "Delete account", "Leave tournament" |
| `.btn-outline` | Bordered, transparent fill | "Cancel", "Back" |
| `.btn-secondary` | Muted filled | "Edit", secondary actions |
| `.btn-ghost` | Invisible until hover | Sidebar nav items, subtle actions |
| `.btn-link` | Text-only with underline on hover | Inline links styled as buttons |
| `.btn-gold` | Gold gradient with glow — premium CTA | "Submit prediction", "Join tournament" |
| `.btn-sm` | Compact size (36px height) | Filter chips, inline edits |
| `.btn-lg` | Large size (44px height) | Login, register, main CTAs |
| `.btn-icon` | Square 40×40, no padding | Sidebar toggle, close, theme toggle |

Compose: `<button class="btn btn-default btn-lg">Login</button>`

### 6.2 Cards

| Class | Purpose |
|-------|---------|
| `.card-gradient` | Subtle gradient + shadow — stat summaries on dashboard |
| `.stat-card` | Standard bordered card — points, win rate, streak |
| `.match-card` | Prediction card — teams, scores, inputs. Gold highlight + lift on hover |

### 6.3 Ranking Badges

| Class | Purpose |
|-------|---------|
| `.rank-badge` | Base — 32px circle, bold centered number |
| `.rank-badge-gold` | 1st place — gold gradient |
| `.rank-badge-silver` | 2nd place — secondary fill |
| `.rank-badge-bronze` | 3rd place — bronze fill |

### 6.4 Page Structure

| Class | Purpose |
|-------|---------|
| `.page-header` | Wrapper for title + subtitle, 2rem bottom margin |
| `.page-title` | 30px bold foreground text |
| `.page-subtitle` | Muted secondary text |
| `.sidebar-gradient` | Navy gradient for sidebar background |

### 6.5 Utilities

| Class | Purpose |
|-------|---------|
| `.container` | Centered max-width wrapper |
| `.text-gradient-gold` | Gold gradient text (background-clip) — scores, highlights |
| `.font-display` | Bebas Neue display font with wide tracking |

---

## 7. Animations

| Name | Duration | Usage |
|------|----------|-------|
| `animate-fade-in` | 0.5s ease-out | Page/section entry. Cards appearing on route change |
| `animate-slide-in` | 0.4s ease-out | Sidebar opening on mobile, panel transitions |
| `animate-pulse-gold` | 2s infinite | Open prediction cards — gold glow pulse to invite interaction |

---

## 8. Interaction Patterns

### 8.1 Focus States
All interactive elements use a **gold double-ring** on focus-visible: 2px background gap + 4px gold ring. This keeps focus indicators on-brand and clearly visible against both light and dark backgrounds.

### 8.2 Hover States
- Buttons: slight background color shift (10-20% opacity change)
- Cards: lift (`translateY(-2px)`) + border color change to accent gold + shadow increase
- Gold buttons: stronger lift + expanded gold glow shadow

### 8.3 Disabled States
`opacity: 0.5` + `pointer-events: none`. Applied to buttons, inputs, and locked prediction cards.

### 8.4 Transitions
All interactive transitions use `0.15s` for buttons (color changes feel instant) and `0.3s` for cards (lift/shadow needs to feel smooth, not jarring).

---

## 9. Responsive Behavior

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| Desktop (≥1024px) | Always visible, fixed left | Content fills remaining space |
| Tablet (768–1023px) | Collapsed to icons-only, expand on hover | Content fills full width with smaller padding |
| Mobile (<768px) | Hidden, hamburger toggle, slides in as overlay | Single column, stacked cards |

Match cards stack vertically on mobile. Ranking table becomes a card list on narrow screens. Score inputs remain side-by-side (they're narrow enough).

---

## 10. Dark Mode Strategy

- Toggled by adding/removing `.dark` class on `<html>`
- Preference stored in `localStorage`
- Respects system preference on first visit via `prefers-color-scheme` media query
- Toggle lives in Profile settings and optionally in sidebar footer
- `@custom-variant dark` in Tailwind v4 enables `dark:` prefix on all utilities

---

## 11. Match Card Detail — Prediction States

The match card is the most complex UI element. Here is the full state matrix:

```
┌──────────────────────────────────────────────────────┐
│  🇫🇷 France         [2] - [1]         Germany 🇩🇪    │  ← score inputs (editable)
│                                                      │
│  Scorer: [Mbappé     ▾]    Scorer: [No Goal   ▾]    │  ← knockout only
│                                                      │
│  ⏰ Closes in 2h 30m           [Save Prediction]     │
└──────────────────────────────────────────────────────┘
```

**Scorer dropdown options per team:**
- All squad players for that team (fetched from API)
- "Own Goal" — predicting the opposing team scores via own goal
- "No Goal" — predicting this team doesn't score at all

**Visual states by prediction lifecycle:**
- **Open**: White/card background, gold pulsing border, interactive inputs
- **Submitted**: User's prediction shown, checkmark icon, editable, muted gold border
- **Locked**: Read-only, grey border, dimmed text
- **Live**: Green pulsing dot, real scores shown alongside prediction
- **Completed**: Result + points. Border color = gold (exact), green (correct result), red (wrong)
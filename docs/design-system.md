# GoalCast — Design System Reference

The canonical reference for every visual and interaction decision in the GoalCast application. Covers brand identity, color tokens, typography, spacing, component classes, animations, responsive behavior, dark mode strategy, and page composition patterns.

**Tech stack:** Angular 21, Tailwind CSS v4, Bootstrap Icons via `@ng-icons/bootstrap-icons`.

**Architecture:** Purely visual elements (Button, Badge, Label, Separator) are Tailwind `@utility` or `@layer components` classes — not Angular components. Angular components are used only when behavior or state is needed (Input, Select, Dialog, Tabs, Sidebar, etc.).

---

## 1. Brand & Identity

**Navy + Gold.** Inspired by premium sports branding (Champions League, elite club crests). Gold is the constant brand anchor across both modes. Dark mode is the primary experience — sports apps are typically used in the evening.

---

## 2. Color Tokens

All colors use raw HSL channels stored as CSS custom properties. Wrapped with `hsl()` at the Tailwind `@theme` level, which enables opacity modifiers like `bg-primary/50`.

### 2.1 Light Theme (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `220 25% 97%` | Page background |
| `--foreground` | `220 60% 10%` | Primary text |
| `--card` | `0 0% 100%` | Card surfaces |
| `--card-foreground` | `220 60% 10%` | Card text |
| `--popover` | `0 0% 100%` | Popover/dropdown surfaces |
| `--popover-foreground` | `220 60% 10%` | Popover text |
| `--primary` | `220 60% 15%` | Dark navy — headers, sidebar, primary actions |
| `--primary-foreground` | `45 100% 96%` | Text on primary |
| `--secondary` | `220 20% 92%` | Subtle backgrounds |
| `--secondary-foreground` | `220 60% 15%` | Text on secondary |
| `--muted` | `220 15% 94%` | Muted backgrounds (disabled cards, empty states) |
| `--muted-foreground` | `220 10% 45%` | Subdued text, labels, timestamps |
| `--accent` | `45 100% 50%` | Gold — CTAs, highlights, active states, focus rings. **Always gold in both modes** |
| `--accent-foreground` | `220 60% 10%` | Text on accent |
| `--destructive` | `0 72% 51%` | Errors, delete actions, wrong predictions |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive |
| `--success` | `142 76% 36%` | Correct predictions, positive trends |
| `--success-foreground` | `0 0% 100%` | Text on success |
| `--border` | `220 20% 88%` | Default borders |
| `--input` | `220 20% 88%` | Input borders (separate token for future independent theming) |
| `--ring` | `45 100% 50%` | Focus ring — always gold |
| `--radius` | `0.75rem` | Base border radius (12px) |

### 2.2 Dark Theme (`.dark`)

| Token | Value |
|-------|-------|
| `--background` | `220 60% 8%` |
| `--foreground` | `220 20% 95%` |
| `--card` | `220 50% 12%` |
| `--card-foreground` | `220 20% 95%` |
| `--popover` | `220 50% 12%` |
| `--popover-foreground` | `220 20% 95%` |
| `--primary` | `45 100% 50%` |
| `--primary-foreground` | `220 60% 10%` |
| `--secondary` | `220 40% 18%` |
| `--secondary-foreground` | `220 20% 95%` |
| `--muted` | `220 40% 15%` |
| `--muted-foreground` | `220 15% 60%` |
| `--accent` | `45 100% 50%` |
| `--accent-foreground` | `220 60% 10%` |
| `--destructive` | `0 72% 51%` |
| `--destructive-foreground` | `0 0% 100%` |
| `--border` | `220 40% 18%` |
| `--input` | `220 40% 18%` |
| `--ring` | `45 100% 50%` |

**Note:** `primary` swaps between modes — navy in light, gold in dark. `accent` stays gold in both modes.

### 2.3 Sidebar Tokens

The sidebar is always dark navy regardless of mode — a fixed dark surface with gold accents.

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-background` | `220 60% 12%` | `220 60% 6%` |
| `--sidebar-foreground` | `220 20% 90%` | `220 20% 90%` |
| `--sidebar-primary` | `45 100% 50%` | `45 100% 50%` |
| `--sidebar-primary-foreground` | `220 60% 10%` | `220 60% 10%` |
| `--sidebar-accent` | `220 50% 20%` | `220 50% 15%` |
| `--sidebar-accent-foreground` | `220 20% 95%` | `220 20% 95%` |
| `--sidebar-border` | `220 40% 20%` | `220 40% 12%` |
| `--sidebar-ring` | `45 100% 50%` | `45 100% 50%` |

### 2.4 Gradients & Shadows

```css
--gradient-gold: linear-gradient(135deg, hsl(45 100% 50%), hsl(38 100% 45%));
--gradient-navy: linear-gradient(135deg, hsl(220 60% 15%), hsl(220 70% 8%));
--gradient-card: linear-gradient(145deg, hsl(0 0% 100%), hsl(220 20% 98%));
--shadow-card: 0 4px 24px -4px hsl(220 60% 15% / 0.08);
--shadow-gold: 0 4px 20px -4px hsl(45 100% 50% / 0.4);
```

| Token | Where used |
|-------|------------|
| `--gradient-gold` | Gold CTA buttons, rank-1 badge, prediction submit |
| `--gradient-navy` | Sidebar background |
| `--gradient-card` | Stat cards (light mode) |
| `--shadow-card` | Default card elevation |
| `--shadow-gold` | Gold buttons, active prediction card |

### 2.5 Prediction-Specific Colors

Applied contextually using existing tokens:

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

## 3. Typography

### 3.1 Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Body / UI | Inter | 300–800 | All body text, labels, buttons, inputs, table data |
| Display | Bebas Neue | 400 | Tournament titles, hero scores, large numbers, page headers where impact is needed |

Fonts are bundled directly into the build (not Google Fonts CDN).

CSS custom properties:
- `--font-sans`: `'Inter', sans-serif`
- `--font-display`: `'Bebas Neue', sans-serif`

### 3.2 Type Scale

Uses Tailwind defaults (rem-based, 16px root):

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Timestamps, match kick-off times, fine print, captions, badge text |
| `text-sm` | 14px | Table body, secondary labels, card metadata, body text |
| `text-base` | 16px | Body text, input values, descriptions |
| `text-lg` | 18px | Card titles, section headers |
| `text-xl` | 20px | Page subtitles, stat values, card titles (bold variant) |
| `text-2xl` | 24px | Page titles, stat values (bold), display numbers |
| `text-3xl` | 30px | Dashboard section headers (`.page-title`), display numbers (`.font-display`) |
| `text-4xl` | 36px | Auth page titles (`.font-display`), hero step numbers |
| `text-5xl`+ | 48px+ | Hero headline (`.font-display`), up to `text-7xl` on desktop |

### 3.3 Type Scale Usage by Context

| Context | Classes |
|---------|---------|
| Page title | `text-3xl font-bold text-foreground` |
| Page subtitle | `text-muted-foreground` |
| Section heading | `text-lg font-semibold` |
| Card title | `text-lg font-semibold` or `text-xl font-bold` |
| Stat value | `text-2xl font-bold` |
| Display number (winners) | `font-display text-3xl tracking-wider` |
| Auth page title | `font-display text-4xl tracking-wider` |
| Hero headline | `font-display text-5xl md:text-7xl tracking-wider` |
| Body text | `text-sm` |
| Caption/helper | `text-xs text-muted-foreground` |
| Badge text | `text-xs font-medium` |

### 3.4 Heading Style

All headings use Inter bold with tight letter-spacing (`tracking-tight` / `-0.025em`). Keeps headings compact and modern without needing the display font for every title.

The `.font-display` class (defined in `@layer base`) applies Bebas Neue with wider tracking (`0.05em`).

---

## 4. Spacing & Layout

### 4.1 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` (base / `radius-lg`) | `0.75rem` (12px) | Cards, modals, large surfaces |
| `--radius-md` | `calc(var(--radius) - 2px)` (10px) | Buttons, inputs, dropdowns |
| `--radius-sm` | `calc(var(--radius) - 4px)` (8px) | Tags, small chips, badges |
| `9999px` (full) | Circle | Avatars, rank badges |

### 4.2 Container

Max width `1400px`, centered with auto margins. Defined as `@utility container`.

```css
@utility container {
  margin-inline: auto;
  max-width: 1400px;
}
```

### 4.3 Spacing Conventions

| Pattern | Value |
|---------|-------|
| Page content padding | `p-6` |
| Card padding | `p-4` to `p-6` |
| Section gap | `gap-6` |
| Component gap | `gap-4` |
| Header height | `h-14` |
| Page header margin-bottom | `mb-8` |
| Inline element gaps | `gap-2` (buttons with icons, badge + text) |
| Container max-width (forms) | `max-w-2xl` |
| Container max-width (auth pages) | `max-w-md` |

### 4.4 Responsive Breakpoints

Uses Tailwind defaults:

| Breakpoint | Behavior |
|------------|----------|
| Default (mobile) | Single column, sidebar collapsed |
| `md` (768px) | 2-column grids, podium layout |
| `lg` (1024px) | 3-4 column grids, sidebar visible |

---

## 5. CSS Architecture

Tailwind v4 uses CSS cascade layers. The layer order from lowest to highest priority:

```
base  <  theme  <  components  <  utilities
```

Every style in the project lives in one of these layers. Styles placed outside any layer end up in a higher-priority implicit layer that overrides everything — including utilities — which breaks the system.

### 5.1 `@layer base` — Variables, Resets, Element Defaults

Contains `:root` / `.dark` color variables, the `*` border reset, `body` defaults, heading styles, and `.font-display`.

The `*` border reset makes every bare `border` or `border-b` use the `--border` token. Because it's in `@layer base`, utilities like `border-destructive` override it cleanly.

```css
@layer base {
  :root { /* ...all color variables... */ }
  .dark { /* ...dark overrides... */ }

  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3, h4, h5, h6 { @apply font-sans font-bold tracking-tight; }
  .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
}
```

### 5.2 `@layer components` — Reusable UI Classes

Component classes like `.btn`, `.match-card`, `.stat-card`, `.rank-badge`, and `.page-title` live here. They override base resets but can be overridden by utility classes in templates.

Use `@apply` to compose Tailwind utilities. Use raw CSS only for properties without a Tailwind utility equivalent (gradients, custom shadows, transforms).

### 5.3 `@utility` — Single-Purpose Atomic Classes

For custom classes that behave like built-in Tailwind utilities — single-purpose, no pseudo-selectors, no nesting. Highest cascade priority. Integrate with Tailwind tooling (IDE autocomplete, variant support like `dark:`, `md:`).

### 5.4 Summary

| Layer | What goes here | Can be overridden by |
|-------|----------------|----------------------|
| `@layer base` | `:root`/`.dark` variables, `*` reset, `body`, headings | Components, utilities |
| `@layer components` | `.btn`, `.match-card`, `.stat-card`, `.rank-badge`, `.page-title` | Utilities |
| `@utility` | `.container`, `.text-gradient-gold`, `.badge-*`, `.form-label`, `.separator` | Nothing (highest priority) |

---

## 6. Component Classes

### 6.1 Buttons (`@layer components`)

All buttons compose `.btn` (base) with a variant class. The base class provides flex layout, rounded corners, 14px medium text, and a gold focus ring.

| Class | Purpose | Example usage |
|-------|---------|---------------|
| `.btn` | Base — always required | Combined with a variant |
| `.btn-default` | Primary filled (navy/gold depending on mode) | "Save prediction", "Login" |
| `.btn-destructive` | Red filled | "Delete account", "Leave tournament" |
| `.btn-outline` | Bordered, transparent fill | "Cancel", "Back" |
| `.btn-secondary` | Muted filled | "Edit", secondary actions |
| `.btn-ghost` | Invisible until hover | Sidebar nav items, subtle actions |
| `.btn-link` | Text-only with underline on hover | Inline links styled as buttons |
| `.btn-gold` | Gold gradient with glow — premium CTA | "Submit prediction", "Join tournament" |
| `.btn-sm` | Compact size (`h-10 px-4`) | Filter chips, inline edits |
| `.btn-lg` | Large size (`h-14 px-10`) | Login, register, main CTAs |
| `.btn-icon` | Square (`h-12 w-12 p-0`) | Sidebar toggle, close, theme toggle |

**Usage:** `<button class="btn btn-default btn-lg">Login</button>`

**Focus:** `outline-none ring-2 ring-ring ring-offset-2 ring-offset-background`
**Disabled:** `pointer-events-none opacity-50`
**SVG children:** `pointer-events-none size-4 shrink-0`

### 6.2 Cards (`@layer components`)

| Class | Purpose |
|-------|---------|
| `.card-gradient` | Subtle gradient + shadow — stat summaries on dashboard |
| `.stat-card` | Standard bordered card — `bg-card rounded-xl p-6 border border-border` |
| `.match-card` | Prediction card — `bg-card rounded-xl p-4 border border-border`. Gold highlight + lift on hover |

### 6.3 Ranking Badges (`@layer components`)

| Class | Purpose |
|-------|---------|
| `.rank-badge` | Base — `w-8 h-8` circle, bold centered number |
| `.rank-badge-gold` | 1st place — gold gradient |
| `.rank-badge-silver` | 2nd place — secondary fill |
| `.rank-badge-bronze` | 3rd place — bronze fill (`hsl(25 75% 35%)`) |

### 6.4 Page Structure (`@layer components`)

| Class | Purpose |
|-------|---------|
| `.page-header` | Wrapper for title + subtitle, `mb-8` |
| `.page-title` | `text-3xl font-bold text-foreground mb-2` |
| `.page-subtitle` | `text-muted-foreground` |
| `.sidebar-gradient` | Navy gradient for sidebar background |

### 6.5 Badges (`@utility`)

| Class | Purpose |
|-------|---------|
| `.badge` | Base — inline-flex, 12px medium, pill-shaped |
| `.badge-default` | Primary fill |
| `.badge-secondary` | Secondary fill |
| `.badge-destructive` | Red fill |
| `.badge-outline` | Bordered, transparent |
| `.badge-accent` | Gold tint (`accent/0.1` background, gold text) |
| `.badge-success` | Green fill |

**Usage:** `<span class="badge badge-accent">Group A</span>`

### 6.6 Form & Layout Utilities (`@utility`)

| Class | Purpose |
|-------|---------|
| `.container` | Centered max-width wrapper (1400px) |
| `.text-gradient-gold` | Gold gradient text via `background-clip: text` |
| `.form-label` | `14px medium` label text |
| `.separator` | Horizontal 1px border-colored line |
| `.separator-vertical` | Vertical 1px border-colored line |

---

## 7. Animations

### 7.1 Keyframe Definitions

| Name | Keyframes | Duration | Usage |
|------|-----------|----------|-------|
| `fade-in` | `opacity: 0, translateY(10px)` → `opacity: 1, translateY(0)` | 0.5s ease-out, forwards | Page/section entry, cards appearing on route change |
| `slide-in` | `opacity: 0, translateX(-20px)` → `opacity: 1, translateX(0)` | 0.4s ease-out, forwards | Sidebar opening on mobile, panel transitions |
| `pulse-gold` | `box-shadow: 0 0 0 0 gold/0.4` ↔ `0 0 0 8px gold/0` | 2s ease-in-out, infinite | Open prediction cards — gold glow pulse |
| `accordion-down` | `height: 0` → `height: var(--content-height)` | 0.2s ease-out | Accordion expand |
| `accordion-up` | `height: var(--content-height)` → `height: 0` | 0.2s ease-out | Accordion collapse |

### 7.2 Staggered Animation Pattern

Lists and grids use `animate-fade-in` with `animation-delay: index * 50–100ms` increments for sequential reveal.

---

## 8. Interaction Patterns

### 8.1 Focus States

All interactive elements use a **gold double-ring** on `focus-visible`: 2px background gap + 4px gold ring. Keeps focus indicators on-brand and visible against both light and dark backgrounds.

### 8.2 Hover States

- **Buttons:** Slight background color shift (10-20% opacity change)
- **Cards:** Lift (`translateY(-2px)`) + border color change to accent gold + shadow increase
- **Gold buttons:** Stronger lift + expanded gold glow shadow

### 8.3 Disabled States

`opacity: 0.5` + `pointer-events: none`. Applied to buttons, inputs, and locked prediction cards.

### 8.4 Transitions

- Buttons: `0.15s` (color changes feel instant)
- Cards: `0.3s` (lift/shadow needs to feel smooth)

---

## 9. Dark Mode Strategy

- Toggled by adding/removing `.dark` class on `<html>`
- Preference stored in `localStorage`
- Respects system preference on first visit via `prefers-color-scheme` media query
- Toggle lives in Profile settings and optionally in sidebar footer
- `@custom-variant dark (&:where(.dark, .dark *))` enables `dark:` prefix on all utilities

---

## 10. Responsive Behavior

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| Desktop (≥1024px / `lg`) | Always visible, fixed left | Content fills remaining space |
| Tablet (768–1023px / `md`) | Collapsed to icons-only, expand on hover | Content fills full width with smaller padding |
| Mobile (<768px) | Hidden, hamburger toggle, slides in as overlay | Single column, stacked cards |

### 10.1 Responsive Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Sidebar | Collapsed, hamburger trigger | Always visible |
| Stats grid | 2 columns | 4 columns (`grid-cols-2 lg:grid-cols-4`) |
| Match card grids | 1 column | 2 columns (`md:grid-cols-2`) |
| Dashboard layout | Stacked (matches then sidebar widgets) | 3-col (`lg:grid-cols-3`) |
| Podium | Stacked (1st, 2nd, 3rd) | Reordered (2nd, 1st, 3rd) with offset padding |
| Auth pages | Full width with padding | Centered `max-w-md` |
| Winners cards | Stacked | Horizontal (year sidebar + info) |
| Landing hero | `text-5xl`, stacked CTAs | `text-7xl`, inline CTAs |
| Landing features | 1 column | 4 columns (`lg:grid-cols-4`) |

---

## 11. Page Layouts

Three distinct layout contexts used across the application:

### 11.1 Public Layout

Used by: Landing, Login, Register, Forgot Password, Legal pages.
- Full-width, no sidebar, no auth required
- Sticky navigation bar with logo + auth links (Login / Sign Up)

**Auth pages (Login, Register, Forgot Password)** share: `min-h-screen bg-primary`, centered `max-w-md` card with backdrop blur (`bg-card/5 backdrop-blur-md shadow-2xl`), logo block, legal links footer.

### 11.2 Profile Layout

Used by: Profile, Create League.
- Full-width, no sidebar
- Minimal header: logo + user email + logout button
- Auth required

### 11.3 Dashboard Layout

Used by: All league-scoped pages (Dashboard, Predictions, Ranking, Winners, Rules).
- Sidebar navigation (Dashboard, My Predictions, Full Ranking, Past Winners, Rules)
- Header with league indicator: current league name badge + "Change" link back to `/profile`
- Header: `h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10`
- Content area: `flex-1 p-6 overflow-auto`
- Auth required, league membership required

---

## 12. Component Library

### 12.1 Positioning Strategy

| Element type | Mechanism |
|-------------|-----------|
| **Modals** (Dialog, Alert Dialog, Sheet, Drawer) | Native `<dialog>` element |
| **Anchored floating** (Select dropdown, Popover, Tooltip, Dropdown Menu, Hover Card) | `absolute`/`relative` CSS, with CSS `anchor()` as upgrade path |

### 12.2 Primitives — Form & Input

| Component | Purpose | Key design notes |
|-----------|---------|------------------|
| Input | Single-line text input | `bg-background border-input rounded-md px-3 py-2 text-sm`, gold focus ring. Auth variant: `pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground` |
| Textarea | Multi-line text input | Same base styling as Input, `min-h-[80px]` |
| Checkbox | Boolean toggle | Rounded square, accent color when checked |
| Radio Group | Single selection from options | Circular indicators. Parent `RadioGroup` + child `RadioGroupItem` |
| Select | Dropdown selection | Trigger with chevron, `bg-background` trigger, `bg-popover` content |
| Switch | On/off toggle | Pill-shaped track, circular thumb, accent color when on |
| FormGroup | Label + control + description + error wrapper | Vertical stack `space-y-2`, `mb-4` between groups |
| Input OTP | Verification code input | Series of single-character input boxes |

All form components implement `ControlValueAccessor` for reactive form integration.

### 12.3 Primitives — Display & Feedback

| Component | Purpose | Key design notes |
|-----------|---------|------------------|
| Progress | Visual completion indicator | Track with colored fill, `h-2` (tournament) or `h-1.5` (ranking) |
| Skeleton | Loading placeholder | Animated pulse rectangle |
| Alert | Informational messages | Bordered card with icon + title + description. Variants: `default`, `destructive` |
| Toast | Transient notifications | Service-based (`ToastService.success()`, `.error()`, `.info()`). Auto-dismiss |

### 12.4 Primitives — Overlay & Navigation

| Component | Purpose | Key design notes |
|-----------|---------|------------------|
| Dialog | Modal for focused tasks | Native `<dialog>`, centered overlay with backdrop blur |
| Alert Dialog | Confirmation for destructive actions | Same as Dialog with required confirm/cancel buttons |
| Sheet | Side panel | `<dialog>` with CSS slide animation |
| Popover | Floating content anchored to trigger | `absolute`/`relative` positioning |
| Tooltip | Simple text tooltip | Directive: `<button appTooltip="Help">` |
| Dropdown Menu | Click-triggered menu | Trigger + Content + Items + Separator |
| Tabs | Tabbed content switching | Tab triggers with count badges |
| Pagination | Page navigation controls | Previous/next buttons with page numbers |

### 12.5 Primitives — Layout & Structure

| Component | Purpose | Key design notes |
|-----------|---------|------------------|
| Card | Universal content container | `bg-card border-border rounded-xl`. Sub-components: Header, Title, Description, Content, Footer. Auth variant: `border-primary-foreground/10 bg-card/5 backdrop-blur-md shadow-2xl` |
| Accordion | Collapsible content sections | `accordion-down`/`accordion-up` animations. `type`: `single` or `multiple` |
| Collapsible | Simple show/hide toggle | `[open]` input and `(openChange)` output |
| Table | Data tables | Sub-components: Header, Body, Row, Head, Cell. Alternating row styles |
| Sidebar | Collapsible navigation sidebar | `sidebar-gradient` background, collapses on mobile. Provider manages open/collapsed state |

### 12.6 Domain Components

| Component | Purpose | Key design notes |
|-----------|---------|------------------|
| MatchCard | Match with teams, date, scores, phase badge | `match-card` utility. Stage badge: `badge badge-accent`. Hover lifts card |
| StatsCards | 4 stat cards grid | `grid-cols-2 lg:grid-cols-4`. Each uses `stat-card`. Staggered fade-in |
| RankingCard | Top-5 dashboard leaderboard | `card-gradient`. Current user: `bg-accent/10 border border-accent/20` |
| TournamentStatus | Tournament progress overview | `card-gradient`. Progress bar + info grid + next phase callout |
| ScorerPredictionInput | Knockout scorer prediction | Radio group (Player / Own Goal / No Goal) + conditional Select dropdown |
| LeagueManagement | League cards with member management | `card-gradient` cards. Owner/Member badges. Invite section |
| AppSidebar | Navigation sidebar | `sidebar-gradient` background. Gold active state. Staggered slide-in (50ms) |
| Footer | Site-wide footer | `border-t border-border bg-card/50 py-8 px-6`. Cookie dialog with Switch toggles |

---

## 13. Shared Visual Patterns

| Pattern | Implementation |
|---------|----------------|
| Page header | `page-header` > `page-title` + `page-subtitle` utilities |
| Section titles | `text-lg font-semibold flex items-center gap-2` with accent-colored icon |
| Staggered animations | `animate-fade-in` with `animation-delay: index * 100ms` |
| Current user highlight | `bg-accent/10 border border-accent/20` in lists |
| Card containers | `card-gradient` utility for most content blocks |
| Gold CTA | Primary actions: `btn btn-gold`. Secondary: `btn btn-outline` |
| Auth page layout | `min-h-screen bg-primary`, centered `max-w-md`, backdrop blur card, logo block, legal links footer |
| Footer | Present on all pages (inside DashboardLayout for authenticated, standalone for public) |

---

## 14. Icon Library

Bootstrap Icons via `@ng-icons/bootstrap-icons`. Icon mapping by usage:

| Icon | Usage |
|------|-------|
| Home / House | Dashboard nav |
| Edit / Pencil | Predictions nav |
| Trophy | Ranking nav, logos, winners, stats |
| Award | Winners nav |
| BookOpen / Book | Rules nav |
| Medal | Points display |
| Target / Bullseye | Accuracy stat |
| TrendingUp / GraphUp | Predictions stat |
| Calendar | Match dates |
| Clock | Match times |
| ChevronRight / ChevronLeft | Links, navigation, back |
| ArrowLeft | Back to predictions |
| User / Users / People | Profile, player selection, leagues |
| Mail / Envelope | Email input icon, forgot password |
| Lock | Password input icon, locked predictions |
| Save / Floppy | Save prediction |
| Check | Saved state, copy confirmation |
| AlertTriangle / ExclamationTriangle | Important notice, validation errors |
| Ban / Slash | No goal option |
| Goal | Own goal option |
| Star | Highlights |
| Settings / Gear | Profile nav |
| LogOut / BoxArrowRight | Sidebar footer |
| Crown | New league button |
| Copy / Link | Copy invite link |
| Cookie | Cookie settings button |
| Shield | Privacy page |
| FileText / FileEarmark | Terms page |

---

## 15. Match Card States

The match card is the most complex UI element. Full state matrix:

```
┌──────────────────────────────────────────────────────┐
│  🇫🇷 France         [2] - [1]         Germany 🇩🇪    │  ← score inputs (editable)
│                                                      │
│  Scorer: [Mbappé     ▾]    Scorer: [No Goal   ▾]    │  ← knockout only
│                                                      │
│  ⏰ Closes in 2h 30m           [Save Prediction]     │
└──────────────────────────────────────────────────────┘
```

| State | Visual treatment |
|-------|------------------|
| **Open** | White/card background, gold pulsing border (`animate-pulse-gold`), interactive inputs |
| **Submitted** | User's prediction shown, checkmark, editable, muted gold border (no pulse) |
| **Locked** | Read-only, grey border, dimmed text, `opacity-50` |
| **Live** | Green pulsing dot, real scores shown alongside prediction |
| **Completed** | Result + points. Border: gold (exact), green (correct result), red (wrong) |
| **Future** | Visible but disabled. "Opens on [date]" label. Greyed card, no inputs |

**Scorer dropdown options per team (knockout only):**
- All squad players for that team (from API)
- "Own Goal" — opposing team scores via own goal
- "No Goal" — team doesn't score

---

## 16. Tailwind Theme Configuration

The `@theme` block maps CSS custom properties to Tailwind utility names and defines animations:

```css
@theme {
  --font-sans: 'Inter', sans-serif;
  --font-display: 'Bebas Neue', sans-serif;

  /* Color mappings: --color-{name} → bg-{name}, text-{name}, border-{name} */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  /* ...etc for all tokens... */

  /* Sidebar colors */
  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  /* ...etc... */

  /* Radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Animations */
  --animate-fade-in: fade-in 0.5s ease-out forwards;
  --animate-slide-in: slide-in 0.4s ease-out forwards;
  --animate-pulse-gold: pulse-gold 2s ease-in-out infinite;

  @keyframes fade-in { /* ... */ }
  @keyframes slide-in { /* ... */ }
  @keyframes pulse-gold { /* ... */ }
}
```

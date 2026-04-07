# Landing Page Design

Port of the reference `docs/world-cup-predictor/src/pages/Landing.tsx` to Angular 21 + GoalCast design system. Same
structure, adapted to Tailwind CSS v4 tokens, Bootstrap Icons, and Angular conventions.

---

## 1. Route Change

Remove the existing dashboard redirect and replace with the landing page:

```typescript
// Remove: { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
// Remove: { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
// Add:
{
    path: '', component
:
    LandingpageComponent
}
```

Landing page becomes the root route. No guards — public page. Dashboard route removed entirely for now.

---

## 2. Sections

### 2.1 Nav (Sticky)

- Sticky top, `bg-card/80 backdrop-blur-sm`, bottom border
- Left: icon (Bootstrap `trophy`) + "GOALCAST" in `font-display text-xl tracking-wider`
- Right: "Log In" ghost button + "Sign Up" `btn-gold` button
- Both link via `routerLink` to `/login` and `/register`
- Max width `max-w-6xl mx-auto`, height `h-16`

### 2.2 Hero

- Centered, `max-w-4xl`, `py-24`
- Badge: "FIFA World Cup 2026" with shield icon, `bg-accent/10 border-accent/20 rounded-full`
- Headline: `text-5xl md:text-6xl font-bold` — "Create. Predict. **Compete.**" where "Compete." uses
  `text-gradient-gold`
- Subtitle: `text-lg text-muted-foreground max-w-2xl mx-auto`
- Two CTAs side by side (stack on mobile):
    - "Create a League" — `btn-gold`, links to `/create-league`
    - "Join an Existing League" — outline variant, links to `/login`

### 2.3 Features

- Background: `bg-muted/30`, `py-20`
- Header: "What You Get" + subtitle
- 4 cards in `grid sm:grid-cols-2 lg:grid-cols-4 gap-6`
- Each card: `card-gradient border-border hover:border-accent/40 transition-colors`
    - Icon in `w-10 h-10 rounded-lg bg-accent/10` container
    - Title: `font-semibold text-lg`
    - Description: `text-sm text-muted-foreground`

**Cards data:**

| Icon (Bootstrap)     | Title                 | Description                                                       |
|----------------------|-----------------------|-------------------------------------------------------------------|
| `bootstrapCrosshair` | Predict Results       | Call the score for every match. See who gets it right.            |
| `bootstrapPeople`    | Invite Friends        | Create a league, share a link, and compete against your crew.     |
| `bootstrapLightning` | Bonus Predictions     | Predict scorers and the tournament winner for extra points.       |
| `bootstrapSliders`   | Customize Your League | Set prediction timeframes, enable bonus rules, and play your way. |

1

### 2.4 How It Works

- `py-20`, `max-w-4xl`
- Header: "How It Works" + "Get started in minutes."
- 4 steps in `grid sm:grid-cols-2 gap-8`
- Each step: large number (`font-display text-4xl text-accent/30`) + title + description

**Steps data:**

| Number | Title             | Description                                             |
|--------|-------------------|---------------------------------------------------------|
| 01     | Create a League   | Pick a tournament, set the rules, and name your league. |
| 02     | Invite Friends    | Share the link or send email invites.                   |
| 03     | Predict Scores    | Submit your predictions before kickoff.                 |
| 04     | Climb the Ranking | Earn points and see who comes out on top.               |

### 2.5 CTA

- `bg-primary text-primary-foreground`, `py-20`
- "Ready?" headline
- Subtitle: "Create a league in under a minute. Set rules, invite friends, start predicting."
- "Get Started" `btn-gold` button linking to `/create-league`

### 2.6 Footer (Inline)

- `bg-card border-t border-border`, `py-8`
- Left: copyright "2026 GoalCast"
- Right: links to `/terms`, `/privacy`, `/imprint` (pages don't exist yet, will 404)
- `max-w-6xl mx-auto`, flex row with `justify-between`
- Links styled `text-sm text-muted-foreground hover:text-foreground`

---

## 3. Technical Details

- **Component:** `LandingpageComponent` (existing, currently empty)
- **Icons:** `@ng-icons/bootstrap-icons` — `bootstrapTrophy`, `bootstrapCrosshair`, `bootstrapPeople`,
  `bootstrapLightning`, `bootstrapSliders`, `bootstrapShield`, `bootstrapArrowRight`
- **No new components** — everything in the landing page template and component class
- **Data arrays** (features, steps) defined as component properties
- **All styling** via Tailwind utility classes from the GoalCast design system
- **Responsive:** Mobile-first, stacks to single column on small screens

---

## 4. Out of Scope

- Terms, Privacy, Imprint pages (links will 404)
- Auth state awareness in nav (always shows Login/Register)
- Create League page
- Any backend calls

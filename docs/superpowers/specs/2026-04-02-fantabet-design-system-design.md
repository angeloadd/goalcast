# Fantabet Design System — Angular Porting Reference

Comprehensive design system specification for porting the World Cup Predictor React prototype into the Angular fantabet frontend. The prototype serves as the visual source of truth. The Angular implementation will use custom Tailwind-based components with opinionated, baked-in styling to minimize per-use customization.

---

## 1. Foundation — Design Tokens & Theming

### 1.1 Color Palette

All colors use HSL and are defined as CSS custom properties for light/dark mode switching.

#### Light Theme (`:root`)

| Token                      | Value              | Usage                                  |
|----------------------------|--------------------|----------------------------------------|
| `--background`             | 220 25% 97%       | Page background                        |
| `--foreground`             | 220 60% 10%       | Primary text                           |
| `--card`                   | 0 0% 100%         | Card surfaces                          |
| `--card-foreground`        | 220 60% 10%       | Card text                              |
| `--popover`               | 0 0% 100%         | Popover/dropdown surfaces              |
| `--popover-foreground`    | 220 60% 10%       | Popover text                           |
| `--primary`               | 220 60% 15%       | Navy — headers, sidebar, primary actions |
| `--primary-foreground`    | 45 100% 96%       | Text on primary                        |
| `--secondary`             | 220 20% 92%       | Subtle backgrounds                     |
| `--secondary-foreground`  | 220 60% 15%       | Text on secondary                      |
| `--muted`                 | 220 15% 94%       | Muted backgrounds                      |
| `--muted-foreground`      | 220 10% 45%       | Subdued text, labels                   |
| `--accent`                | 45 100% 50%       | Gold — CTAs, highlights, badges        |
| `--accent-foreground`     | 220 60% 10%       | Text on accent                         |
| `--destructive`           | 0 72% 51%         | Error, danger actions                  |
| `--destructive-foreground`| 0 0% 100%         | Text on destructive                    |
| `--success`               | 142 76% 36%       | Success states                         |
| `--success-foreground`    | 0 0% 100%         | Text on success                        |
| `--border`                | 220 20% 88%       | Default borders                        |
| `--input`                 | 220 20% 88%       | Input borders                          |
| `--ring`                  | 45 100% 50%       | Focus ring (gold)                      |
| `--radius`                | 0.75rem            | Base border radius                     |

#### Sidebar Tokens (Light)

| Token                        | Value              | Usage                       |
|------------------------------|--------------------|-----------------------------|
| `--sidebar-background`       | 220 60% 12%       | Sidebar background          |
| `--sidebar-foreground`       | 220 20% 90%       | Sidebar text                |
| `--sidebar-primary`          | 45 100% 50%       | Active item highlight (gold)|
| `--sidebar-primary-foreground`| 220 60% 10%      | Text on active item         |
| `--sidebar-accent`           | 220 50% 20%       | Hover/active background     |
| `--sidebar-accent-foreground`| 220 20% 95%       | Text on hover               |
| `--sidebar-border`           | 220 40% 20%       | Sidebar dividers            |
| `--sidebar-ring`             | 45 100% 50%       | Sidebar focus ring          |

#### Dark Theme (`.dark`)

| Token                      | Value              |
|----------------------------|--------------------|
| `--background`             | 220 60% 8%        |
| `--foreground`             | 220 20% 95%       |
| `--card`                   | 220 50% 12%       |
| `--card-foreground`        | 220 20% 95%       |
| `--popover`               | 220 50% 12%       |
| `--popover-foreground`    | 220 20% 95%       |
| `--primary`               | 45 100% 50%       |
| `--primary-foreground`    | 220 60% 10%       |
| `--secondary`             | 220 40% 18%       |
| `--secondary-foreground`  | 220 20% 95%       |
| `--muted`                 | 220 40% 15%       |
| `--muted-foreground`      | 220 15% 60%       |
| `--accent`                | 45 100% 50%       |
| `--accent-foreground`     | 220 60% 10%       |
| `--destructive`           | 0 72% 51%         |
| `--destructive-foreground`| 0 0% 100%         |
| `--border`                | 220 40% 18%       |
| `--input`                 | 220 40% 18%       |
| `--ring`                  | 45 100% 50%       |
| `--sidebar-background`    | 220 60% 6%        |
| `--sidebar-foreground`    | 220 20% 90%       |
| `--sidebar-primary`       | 45 100% 50%       |
| `--sidebar-primary-foreground` | 220 60% 10%  |
| `--sidebar-accent`        | 220 50% 15%       |
| `--sidebar-accent-foreground` | 220 20% 95%   |
| `--sidebar-border`        | 220 40% 12%       |
| `--sidebar-ring`          | 45 100% 50%       |

### 1.2 Typography

| Property       | Value                                     |
|----------------|-------------------------------------------|
| Body font      | `Inter` (weights: 300, 400, 500, 600, 700, 800) |
| Display font   | `Bebas Neue` (headings, stats, page titles) |
| `--font-sans`  | `'Inter', sans-serif`                     |
| `--font-display` | `'Bebas Neue', sans-serif`             |

**Type scale usage from prototype:**

| Context                  | Classes                                        |
|--------------------------|------------------------------------------------|
| Page title               | `text-3xl font-bold text-foreground`           |
| Page subtitle            | `text-muted-foreground`                        |
| Section heading          | `text-lg font-semibold`                        |
| Card title               | `text-lg font-semibold` or `text-xl font-bold` |
| Stat value               | `text-2xl font-bold`                           |
| Display number (winners) | `font-display text-3xl tracking-wider`         |
| Auth page title          | `font-display text-4xl tracking-wider` (Bebas Neue) |
| Body text                | `text-sm`                                      |
| Caption/helper           | `text-xs text-muted-foreground`                |
| Badge text               | `text-xs font-medium`                          |

### 1.3 Spacing & Layout

| Pattern                  | Value                                          |
|--------------------------|------------------------------------------------|
| Base radius              | `0.75rem` (`--radius`)                         |
| Radius large             | `var(--radius)` = `0.75rem`                    |
| Radius medium            | `calc(var(--radius) - 2px)`                    |
| Radius small             | `calc(var(--radius) - 4px)`                    |
| Page content padding     | `p-6`                                          |
| Card padding             | `p-4` to `p-6`                                |
| Section gap              | `gap-6`                                        |
| Component gap            | `gap-4`                                        |
| Header height            | `h-14`                                         |
| Container max-width      | `max-w-2xl` (forms), `max-w-md` (auth pages)  |

**Responsive breakpoints (Tailwind defaults):**

| Breakpoint | Behavior                                         |
|------------|--------------------------------------------------|
| Default    | Single column, sidebar collapsed                 |
| `md`       | 2-column grids, podium layout                   |
| `lg`       | 3-4 column grids, sidebar visible                |

### 1.4 Gradients & Shadows

```css
--gradient-gold: linear-gradient(135deg, hsl(45 100% 50%), hsl(38 100% 45%));
--gradient-navy: linear-gradient(135deg, hsl(220 60% 15%), hsl(220 70% 8%));
--gradient-card: linear-gradient(145deg, hsl(0 0% 100%), hsl(220 20% 98%));
--shadow-card: 0 4px 24px -4px hsl(220 60% 15% / 0.08);
--shadow-gold: 0 4px 20px -4px hsl(45 100% 50% / 0.4);
```

### 1.5 Animations

| Name             | Keyframes                                                     | Duration  |
|------------------|---------------------------------------------------------------|-----------|
| `fade-in`        | `opacity: 0, translateY(10px)` → `opacity: 1, translateY(0)` | 0.5s ease-out, forwards |
| `slide-in`       | `opacity: 0, translateX(-20px)` → `opacity: 1, translateX(0)`| 0.4s ease-out, forwards |
| `pulse-gold`     | `box-shadow: 0 0 0 0 hsl(45 100% 50% / 0.4)` ↔ `0 0 0 8px hsl(45 100% 50% / 0)` | 2s ease-in-out, infinite |
| `accordion-down` | `height: 0` → `height: var(--content-height)`                | 0.2s ease-out |
| `accordion-up`   | `height: var(--content-height)` → `height: 0`                | 0.2s ease-out |

**Staggered animation pattern:** Components use `animation-delay` with `index * 50–100ms` increments for sequential reveal.

### 1.6 Custom Utility Classes

These are defined in `index.css` using `@layer components` and should be ported to Angular's global stylesheet:

```css
.card-gradient {
  background: var(--gradient-card);
  box-shadow: var(--shadow-card);
}

.btn-gold {
  background: var(--gradient-gold);
  box-shadow: var(--shadow-gold);
  color: hsl(var(--primary));
  font-weight: 600;
  transition: all 0.3s;
}
.btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px -4px hsl(45 100% 50% / 0.5);
}

.sidebar-gradient {
  background: var(--gradient-navy);
}

.match-card {
  background: hsl(var(--card));
  border-radius: theme(borderRadius.xl);
  padding: theme(spacing.4);
  border: 1px solid hsl(var(--border));
  transition: all 0.3s;
}
.match-card:hover {
  border-color: hsl(var(--accent));
  box-shadow: theme(boxShadow.lg);
  transform: translateY(-2px);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
}
.rank-badge-gold { background: var(--gradient-gold); color: hsl(var(--primary)); }
.rank-badge-silver { background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); }
.rank-badge-bronze { background: theme(colors.amber.700); color: white; }

.stat-card {
  background: hsl(var(--card));
  border-radius: theme(borderRadius.xl);
  padding: theme(spacing.6);
  border: 1px solid hsl(var(--border));
}

.page-header { margin-bottom: theme(spacing.8); }
.page-title { font-size: theme(fontSize.3xl); font-weight: 700; color: hsl(var(--foreground)); margin-bottom: theme(spacing.2); }
.page-subtitle { color: hsl(var(--muted-foreground)); }

.text-gradient-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 2. Component Library

All components are Angular standalone components using Tailwind for styling. Design tokens from Section 1 are baked into each component's styles so consumers rarely need to override.

### 2.1 Primitives — Form & Input

#### Button
- **Purpose:** Primary action trigger
- **Variants:** `default` (navy), `destructive`, `outline`, `secondary`, `ghost`, `link`, `gold` (custom — uses `.btn-gold`)
- **Sizes:** `default`, `sm`, `lg`, `icon`
- **Angular notes:** Standalone component. Inputs: `variant`, `size`, `disabled`, `loading`. Use `class-variance-authority` pattern or Angular equivalent (host class binding + input-driven class map). Emit `(click)` natively.

#### Input
- **Purpose:** Single-line text input
- **Design:** `bg-background border-input rounded-md px-3 py-2 text-sm`. Focus ring uses `--ring` (gold).
- **Auth variant:** `pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground` with absolute-positioned icon overlay.
- **Angular notes:** Standalone component or directive on native `<input>`. Support `type`, `placeholder`, `disabled`. Icon variant via content projection or wrapper component.

#### Textarea
- **Purpose:** Multi-line text input
- **Design:** Same styling as Input but with `min-h-[80px]` and resize handle.
- **Angular notes:** Directive on native `<textarea>` or standalone component.

#### Checkbox
- **Purpose:** Boolean toggle
- **Design:** Rounded square, accent color when checked, with check icon.
- **Angular notes:** Standalone component wrapping native checkbox with custom visual. Implements `ControlValueAccessor`.

#### Radio Group
- **Purpose:** Single selection from options
- **Design:** Circular indicators, used in ScorerPredictionInput with icon labels.
- **Angular notes:** Parent `RadioGroup` component + child `RadioGroupItem`. Implements `ControlValueAccessor` on the group.

#### Select
- **Purpose:** Dropdown selection
- **Design:** Trigger shows selected value with chevron, dropdown panel with scroll. `bg-background` trigger, `bg-popover` content.
- **Angular notes:** Standalone component with `SelectTrigger`, `SelectContent`, `SelectItem` sub-components via content projection. Uses CDK overlay for positioning.

#### Switch
- **Purpose:** On/off toggle
- **Design:** Pill-shaped track, circular thumb, accent color when on.
- **Angular notes:** Standalone component, implements `ControlValueAccessor`.

#### Slider
- **Purpose:** Range value selection
- **Design:** Track with accent-colored fill, draggable thumb.
- **Angular notes:** Standalone component, implements `ControlValueAccessor`.

#### Toggle
- **Purpose:** Pressable on/off button
- **Variants:** `default`, `outline`
- **Angular notes:** Standalone component with `[pressed]` input and `(pressedChange)` output.

#### Toggle Group
- **Purpose:** Group of mutually exclusive or multi-select toggles
- **Angular notes:** Parent component with `type` input (`single` | `multiple`). Child `ToggleGroupItem` components via content projection.

#### Label
- **Purpose:** Form field label
- **Design:** `text-sm font-medium leading-none`. Disabled state reduces opacity.
- **Angular notes:** Directive on native `<label>` or standalone component with `for` input.

#### Form
- **Purpose:** Form field wrapper with validation
- **Design:** Groups label + control + description + error message. Error text in `text-destructive text-sm`.
- **Angular notes:** Use Angular reactive forms. Create `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` structural components that integrate with `FormGroup`/`FormControl`.

#### Input OTP
- **Purpose:** One-time password / verification code input
- **Design:** Series of single-character input boxes.
- **Angular notes:** Standalone component with `length` input and `(complete)` output.

#### Calendar / Date Picker
- **Purpose:** Date selection
- **Design:** Month grid with navigation. Uses `day-picker` pattern.
- **Angular notes:** Standalone component. Consider Angular CDK or build custom with day grid.

### 2.2 Primitives — Display & Feedback

#### Badge
- **Purpose:** Status labels, tags, categories
- **Variants:** `default`, `secondary`, `destructive`, `outline`
- **Design:** `text-xs font-medium px-2 py-1 rounded-full`. Stage badges use `text-accent bg-accent/10`.
- **Angular notes:** Standalone component with `variant` input.

#### Avatar
- **Purpose:** User profile images
- **Design:** Circular, with fallback initials. Sizes vary: `w-8 h-8` (small), `w-10 h-10` (default), `w-16 h-16` (large), `w-20 h-20` (podium), `w-24 h-24` (profile). Border variants: `border-2 border-sidebar-primary`, `border-4 border-accent/20`, `border-4 border-card`.
- **Angular notes:** Standalone component with `AvatarImage` and `AvatarFallback` sub-components. Inputs: `size`, `src`, `alt`, `fallback`.

#### Progress
- **Purpose:** Visual completion indicator
- **Design:** Track with colored fill bar. Used at `h-2` (tournament status) and `h-1.5` (ranking accuracy).
- **Angular notes:** Standalone component with `value` input (0-100).

#### Skeleton
- **Purpose:** Loading placeholder
- **Design:** Animated pulse rectangle matching content dimensions.
- **Angular notes:** Standalone component with configurable width/height via class or inputs.

#### Alert
- **Purpose:** Informational messages
- **Variants:** `default`, `destructive`
- **Design:** Bordered card with icon + title + description.
- **Angular notes:** Standalone component with `AlertTitle` and `AlertDescription` content projection.

#### Toast / Sonner
- **Purpose:** Transient notifications
- **Design:** Slides in from edge with auto-dismiss. Used for success/error/info feedback on actions.
- **Angular notes:** Service-based (`ToastService.success()`, `.error()`, `.info()`). Global `<app-toaster>` component in root layout.

#### Separator
- **Purpose:** Visual divider
- **Design:** `h-px bg-border` (horizontal) or `w-px bg-border` (vertical).
- **Angular notes:** Standalone component with `orientation` input (`horizontal` | `vertical`).

#### Aspect Ratio
- **Purpose:** Maintains aspect ratio for media containers
- **Angular notes:** Standalone component wrapping content with CSS aspect-ratio.

#### Scroll Area
- **Purpose:** Custom scrollbar container
- **Design:** Thin custom scrollbar track.
- **Angular notes:** Standalone component wrapping CDK scrollable or custom implementation.

### 2.3 Primitives — Overlay & Navigation

#### Dialog
- **Purpose:** Modal dialog for focused tasks
- **Design:** Centered overlay with backdrop blur. Card-style content.
- **Angular notes:** Standalone component using CDK Dialog or custom overlay. `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` sub-components.

#### Alert Dialog
- **Purpose:** Confirmation dialogs for destructive actions
- **Design:** Like Dialog but with explicit confirm/cancel buttons.
- **Angular notes:** Same pattern as Dialog with required action buttons.

#### Sheet
- **Purpose:** Side panel (slides from edge)
- **Sides:** `top`, `right`, `bottom`, `left`
- **Angular notes:** Standalone component using CDK overlay with slide animation.

#### Drawer
- **Purpose:** Bottom sheet (mobile-friendly)
- **Design:** Slides up from bottom with drag handle.
- **Angular notes:** Standalone component, particularly useful for mobile interactions.

#### Popover
- **Purpose:** Floating content anchored to trigger
- **Angular notes:** Standalone component using CDK Overlay for positioning. Content via `ng-template` or content projection.

#### Hover Card
- **Purpose:** Rich tooltip on hover
- **Design:** Card appears on hover with delay.
- **Angular notes:** Standalone component with trigger element and content template.

#### Tooltip
- **Purpose:** Simple text tooltip
- **Design:** Small dark tooltip on hover.
- **Angular notes:** Directive or standalone component. `TooltipProvider` at root for shared delay config.

#### Context Menu
- **Purpose:** Right-click menu
- **Angular notes:** Standalone component wrapping trigger area. Menu items via content projection.

#### Dropdown Menu
- **Purpose:** Click-triggered menu
- **Design:** Used in sidebar for user actions.
- **Angular notes:** Standalone component with `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`.

#### Command
- **Purpose:** Search/command palette (cmdk pattern)
- **Design:** Input + filterable list of commands/actions.
- **Angular notes:** Standalone component with search input, `CommandGroup`, `CommandItem`, `CommandEmpty`.

#### Menubar
- **Purpose:** Horizontal menu bar (app-style menu)
- **Angular notes:** Standalone component with `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`.

#### Navigation Menu
- **Purpose:** Site navigation with mega-menu support
- **Angular notes:** Standalone component with `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`.

#### Breadcrumb
- **Purpose:** Hierarchical navigation trail
- **Angular notes:** Standalone component with `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`.

#### Pagination
- **Purpose:** Page navigation controls
- **Design:** Previous/next buttons with page numbers.
- **Angular notes:** Standalone component with `currentPage`, `totalPages` inputs and `(pageChange)` output.

#### Tabs
- **Purpose:** Tabbed content switching
- **Design:** Used in Predictions page for Group Stage / Knockout / Coming Soon. Tab triggers with count badges.
- **Angular notes:** Standalone component with `TabsList`, `TabsTrigger`, `TabsContent`. Inputs: `defaultValue`, `(valueChange)`.

### 2.4 Primitives — Layout & Structure

#### Card
- **Purpose:** Universal content container — the most-used component in the prototype
- **Sub-components:** `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Design:** Default uses `bg-card border-border rounded-xl`. Enhanced variant uses `.card-gradient` class.
- **Auth variant:** `border-primary-foreground/10 bg-card/5 backdrop-blur-md shadow-2xl`
- **Angular notes:** Standalone component with sub-components via content projection. Each sub-component applies its own padding and typography.

#### Accordion
- **Purpose:** Collapsible content sections
- **Design:** Used in Rules page for FAQs. Trigger text left-aligned, chevron rotates. Content animates with `accordion-down`/`accordion-up`.
- **Angular notes:** `Accordion` parent with `type` (`single` | `multiple`), `AccordionItem`, `AccordionTrigger`, `AccordionContent`. Use Angular animations or CSS for expand/collapse.

#### Collapsible
- **Purpose:** Simple show/hide toggle
- **Angular notes:** Standalone component with `[open]` input and `(openChange)` output.

#### Table
- **Purpose:** Data tables
- **Design:** Used in Rules page for points system. Alternating row styles, consistent padding.
- **Sub-components:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- **Angular notes:** Standalone components composing native table elements with styled defaults.

#### Carousel
- **Purpose:** Horizontal scrollable content
- **Angular notes:** Standalone component wrapping Embla carousel equivalent. `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`.

#### Resizable Panels
- **Purpose:** Draggable split-pane layout
- **Angular notes:** `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.

#### Sidebar
- **Purpose:** Collapsible navigation sidebar
- **Design:** Navy gradient background (`.sidebar-gradient`), collapses on mobile via trigger button. Fixed on desktop.
- **Sub-components:** `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarTrigger`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
- **Angular notes:** Complex component. `SidebarProvider` manages open/collapsed state as a service. `SidebarTrigger` toggles on mobile. Menu items use `routerLink` with `routerLinkActive` for active styling.

### 2.5 Domain Components — Fantabet-Specific

#### MatchCard
- **Purpose:** Displays a match with two teams, date/time, optional scores, and phase badge
- **Design:** Uses `.match-card` utility class. Hover lifts card. Stage badge in `text-accent bg-accent/10 px-2 py-1 rounded-full`. Team flags at `text-2xl`, names at `font-medium text-sm`. Score at `text-xl font-bold`. VS separator when no score.
- **Inputs:** `match: Match`, `showResult: boolean`
- **Used on:** Dashboard (upcoming + recent), Predictions page
- **Angular notes:** Standalone component. Match interface:
  ```typescript
  interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    date: string;
    time: string;
    homeScore?: number;
    awayScore?: number;
    stage: string;
    phase: 'group' | 'round16' | 'quarter' | 'semi' | 'final';
    status: 'upcoming' | 'live' | 'finished';
    predictionsEnabled: boolean;
    homePlayers?: Scorer[];
    awayPlayers?: Scorer[];
  }
  ```

#### StatsCards
- **Purpose:** Grid of 4 stat cards showing user performance metrics
- **Design:** `grid grid-cols-2 lg:grid-cols-4 gap-4`. Each card uses `.stat-card`. Icon in colored circle (`w-10 h-10 rounded-lg {bgColor}`), value at `text-2xl font-bold`, label at `text-sm text-muted-foreground`. Staggered fade-in animation.
- **Stats:** Points (gold icon), Rank (navy icon), Accuracy (green icon), Predictions (gray icon)
- **Inputs:** User data (points, rank, accuracy, total predictions)
- **Used on:** Dashboard
- **Angular notes:** Standalone component. Could accept stats array as input or derive from user data input.

#### RankingCard
- **Purpose:** Compact top-5 leaderboard for dashboard sidebar
- **Design:** `.card-gradient`. Player rows with avatar (`w-8 h-8`), rank badge (gold/silver/bronze gradient), name, points. Current user row highlighted with `bg-accent/10 border border-accent/20`. "View Full Ranking" link at bottom.
- **Inputs:** Players array, current user ID
- **Used on:** Dashboard
- **Angular notes:** Standalone component with `routerLink` to full ranking page.

#### TournamentStatus
- **Purpose:** Tournament progress overview
- **Design:** `.card-gradient`. Progress bar (`h-2`) showing matches played / total. Info grid (`grid grid-cols-2 gap-4`) with matches played and teams remaining in `bg-muted/50 rounded-lg p-3`. Next phase callout in `bg-accent/10 border border-accent/20` with gold text.
- **Inputs:** Tournament status data (stage, matches played/total, teams remaining, next phase, days until)
- **Used on:** Dashboard
- **Angular notes:** Standalone component.

#### ScorerPredictionInput
- **Purpose:** Scorer prediction for knockout matches — select player, own goal, or no goal
- **Design:** Container `p-4 rounded-lg bg-muted/30 border border-border`. Radio group with three options (Player + User icon, Own Goal + Goal icon, No Goal + Ban icon). Conditional Select dropdown appears when "Player" is selected, showing team roster.
- **Inputs:** `match: Match`, `team: 'home' | 'away'`, `value: ScorerValue`, `(onChange): ScorerValue`
- **Value interface:**
  ```typescript
  interface ScorerValue {
    type: 'player' | 'own_goal' | 'no_goal' | null;
    playerId?: string;
  }
  ```
- **Used on:** Predictions page (knockout matches only)
- **Angular notes:** Standalone component, implements `ControlValueAccessor` for reactive form integration.

#### DashboardLayout
- **Purpose:** Authenticated page shell — sidebar + header + content area
- **Design:** Full-height flex layout. Header: `h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10`. Sidebar trigger visible only on mobile (`lg:hidden`). Content area: `flex-1 p-6 overflow-auto`.
- **Angular notes:** Standalone component with `<router-outlet>` for content. Wraps `SidebarProvider` and `AppSidebar`.

#### AppSidebar
- **Purpose:** Navigation sidebar with logo, menu items, and user profile footer
- **Design:** `.sidebar-gradient` background. Logo: gold accent square (`w-10 h-10 rounded-xl bg-accent`) with trophy icon + "FANTABET" in Bebas Neue. Menu items: `flex items-center gap-3 px-3 py-2.5 rounded-lg` with slide-in animation (staggered 50ms). Active state: `bg-sidebar-accent text-sidebar-primary font-medium`. Footer: avatar + user name with link to profile.
- **Menu items:** Dashboard (Home icon), My Predictions (Edit3), Full Ranking (Trophy), Past Winners (Award), Rules (BookOpen)
- **Angular notes:** Standalone component using `routerLink` and `routerLinkActive` directives. Icons from Lucide Angular.

---

## 3. Page Compositions

### 3.1 Authenticated Pages (DashboardLayout)

#### Dashboard (`/`)
```
DashboardLayout
  .page-header
    .page-title "Dashboard"
    .page-subtitle "Welcome back, {name}! Here's your tournament overview."
  StatsCards [user data]
  .grid.lg:grid-cols-3.gap-6
    .lg:col-span-2
      Section "Upcoming Matches"
        .grid.md:grid-cols-2.gap-4
          MatchCard * 4 [animate-fade-in, staggered]
      Section "Recent Results"
        .grid.md:grid-cols-2.gap-4
          MatchCard [showResult=true] * 3 [animate-fade-in, staggered]
    aside
      RankingCard
      TournamentStatus
```

#### Predictions (`/predictions`)
```
DashboardLayout
  .page-header
    .page-title "My Predictions"
    .page-subtitle "Make your predictions before the matches start."
  Tabs [defaultValue="group"]
    TabsList
      TabsTrigger "Group Stage ({count})"
      TabsTrigger "Knockout ({count})"
      TabsTrigger "Coming Soon ({count})"
    TabsContent "group"
      .grid.md:grid-cols-2.gap-6
        For each group match:
          Card.card-gradient [border-success/50 if saved]
            Badge [stage]
            MatchCard-style layout (flags, names)
            Score inputs: Input[w-14 h-12 text-center text-xl font-bold maxLength=2] ":" Input
            Button.btn-gold "Save Prediction" | Button.bg-success "Saved"
    TabsContent "knockout"
      Same as group + ScorerPredictionInput for each team
    TabsContent "coming-soon"
      Locked cards (opacity-60, lock icon, "Predictions not yet open")
```

#### Ranking (`/ranking`)
```
DashboardLayout
  .page-header
    .page-title "Full Ranking"
    .page-subtitle "See how you compare..."
  Top 3 Podium: .grid.md:grid-cols-3.gap-4.mb-8
    Card [md:order-2, md:pt-0] — 1st place (trophy yellow-500)
    Card [md:order-1, md:pt-8] — 2nd place (trophy gray-400)
    Card [md:order-3, md:pt-8] — 3rd place (trophy amber-700)
    Each: Avatar[w-20 h-20 border-4], rank-badge (large: w-10 h-10 text-lg),
          name, .text-gradient-gold points, accuracy %
    Current user: ring-2 ring-accent
  Full Table: Card.card-gradient
    For each player (4th onward):
      Row: rank-badge, Avatar[w-10 h-10], name, Progress[h-1.5], points, accuracy
      Current user row: bg-accent/10 border border-accent/20
```

#### Winners (`/winners`)
```
DashboardLayout
  .page-header
    .page-title "Hall of Fame"
    .page-subtitle "Celebrating our past champions."
  For each past winner:
    Card.card-gradient.overflow-hidden [animate-fade-in, staggered]
      .flex.items-stretch
        Left: .sidebar-gradient.px-6.py-8 — Trophy icon + year (font-display text-3xl)
        Right: .flex-1.p-6 — Avatar[w-16 h-16 border-4 border-accent/20],
               name (text-xl font-bold), points (Medal icon), world cup winner (Flag icon),
               rank-badge-gold (w-12 h-12 text-lg)
  Historical Stats: .grid.grid-cols-2.md:grid-cols-4.gap-4
    Each: .text-center.p-4.bg-muted/50.rounded-lg
      Number: .text-3xl.font-bold.text-gradient-gold
      Label: .text-sm.text-muted-foreground
```

#### Rules (`/rules`)
```
DashboardLayout
  .page-header
    .page-title "Rules & Scoring"
    .page-subtitle "Learn how points are calculated."
  Points System Card.card-gradient
    Table: scenario | points | example
    Points values: font-display text-2xl (gold if > 0, muted if 0)
  How It Works: .grid.md:grid-cols-3.gap-4
    3 cards [staggered animation]:
      Icon circle (bg-accent/10, icon text-accent)
      Step title (font-semibold)
      Description (text-sm text-muted-foreground)
  FAQs Card.card-gradient
    Accordion [type="single", collapsible]
      AccordionItem * N
        Trigger: "text-left hover:text-accent"
        Content: "text-muted-foreground"
  Important Notice Card [border-accent/50 bg-accent/5]
    AlertTriangle icon + title + text
```

#### Profile (`/profile`)
```
DashboardLayout
  .page-header
    .page-title "My Profile"
    .page-subtitle "Manage your account settings."
  .space-y-6.max-w-2xl
    Profile Picture Card [delay: 0ms]
      Avatar[w-24 h-24 border-4 border-accent/20]
      Button[outline, sm] "Change Avatar"
    Personal Info Card [delay: 100ms]
      Input[name], Input[email with Mail icon]
      Button.btn-gold "Save Changes"
    Change Password Card [delay: 200ms]
      Input[current password with Lock icon]
      Separator
      Input[new password], Input[confirm password]
      Button[outline] "Update Password"
    Account Stats Card [delay: 300ms]
      .grid.grid-cols-3.gap-4.text-center
        Points (text-gradient-gold), Predictions, Accuracy
```

### 3.2 Unauthenticated Pages (Standalone)

#### Login (`/login`)
```
.min-h-screen.bg-primary.flex.items-center.justify-center.p-4
  .w-full.max-w-md.space-y-8
    Logo: gold circle + trophy + "FANTABET" (font-display text-4xl) + subtitle
    Card [backdrop-blur-md, bg-card/5, shadow-2xl]
      "Sign In" title
      Input[email, with Mail icon, auth variant]
      Input[password, with Lock icon, auth variant]
      "Forgot password?" link (text-accent)
      Button.w-full.btn-gold "Sign In"
      "Don't have an account? Sign up" link
```

#### Register (`/register`)
```
.min-h-screen.bg-primary.flex.items-center.justify-center.p-4
  .w-full.max-w-md.space-y-8
    Logo: same as Login
    Card [same auth styling]
      "Create Account" title
      Input[name, with User icon, auth variant]
      Input[email, with Mail icon, auth variant]
      Input[password, with Lock icon, auth variant]
      Input[confirm password, with Lock icon, auth variant]
      Button.w-full.btn-gold "Create Account"
      "Already have an account? Sign in" link
```

#### Not Found (`/*`)
```
.flex.min-h-screen.items-center.justify-center.bg-muted
  404 heading (text-4xl font-bold)
  Message (text-xl text-muted-foreground)
  Link to home (text-primary underline)
```

### 3.3 Responsive Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Sidebar | Collapsed, hamburger trigger | Always visible |
| Stats grid | 2 columns | 4 columns |
| Match card grids | 1 column | 2 columns |
| Dashboard layout | Stacked (matches then sidebar widgets) | 3-col (2 matches + 1 sidebar) |
| Podium | Stacked (1st, 2nd, 3rd) | Reordered (2nd, 1st, 3rd) with offset padding |
| Auth pages | Full width with padding | Centered `max-w-md` |
| Winners cards | Stacked | Horizontal (year sidebar + info) |

### 3.4 Shared Patterns

- **Page header:** Every authenticated page uses `.page-header` > `.page-title` + `.page-subtitle`
- **Section titles:** `text-lg font-semibold flex items-center gap-2` with accent-colored icon
- **Staggered animations:** Lists and grids use `animate-fade-in` with `animation-delay: index * 100ms`
- **Current user highlight:** `bg-accent/10 border border-accent/20` wherever the current user appears in a list
- **Card containers:** Most content blocks are wrapped in `Card.card-gradient`
- **Gold CTA:** Primary actions use `.btn-gold`, secondary actions use `variant="outline"`

---

## 4. Data Models

These interfaces define the domain data flowing through components. They should be defined as TypeScript interfaces in the Angular project's shared models.

```typescript
interface Player {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}

interface Scorer {
  id: string;
  name: string;
  team: string;
  number: number;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  homeScore?: number;
  awayScore?: number;
  stage: string;
  phase: 'group' | 'round16' | 'quarter' | 'semi' | 'final';
  status: 'upcoming' | 'live' | 'finished';
  predictionsEnabled: boolean;
  homePlayers?: Scorer[];
  awayPlayers?: Scorer[];
}

interface ScorerValue {
  type: 'player' | 'own_goal' | 'no_goal' | null;
  playerId?: string;
}

interface Winner {
  year: number;
  name: string;
  avatar?: string;
  points: number;
  worldCupWinner: string;
}

interface TournamentStatus {
  currentStage: string;
  matchesPlayed: number;
  totalMatches: number;
  teamsRemaining: number;
  nextPhase: string;
  daysUntilNextPhase: number;
}
```

---

## 5. Icon Library

The prototype uses **Lucide** icons throughout. The Angular equivalent is `lucide-angular`.

**Icons used in the prototype:**

| Icon | Usage |
|------|-------|
| Home | Dashboard nav |
| Edit3 | Predictions nav |
| Trophy | Ranking nav, logos, winners, stats |
| Award | Winners nav |
| BookOpen | Rules nav |
| Medal | Points display |
| Target | Accuracy stat |
| TrendingUp | Predictions stat |
| Calendar | Match dates |
| Clock | Match times |
| ChevronRight | Links, navigation |
| User / Users | Profile, player selection |
| Mail | Email input icon |
| Lock | Password input icon |
| Save | Save prediction |
| Check | Saved state |
| AlertTriangle | Important notice |
| Ban | No goal option |
| Goal | Own goal option (custom or mapped) |
| Star | Highlights |
| Settings | Profile nav |
| LogOut | Sidebar footer |
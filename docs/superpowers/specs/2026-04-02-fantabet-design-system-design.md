# Fantabet Design System — Angular Porting Reference

Comprehensive design system specification for porting the World Cup Predictor React prototype into the Angular fantabet frontend. The prototype serves as the visual source of truth. The Angular implementation uses custom Tailwind-based components with opinionated, baked-in styling to minimize per-use customization.

**Key decisions:**
- Purely visual elements (Button, Badge, Label, Separator) are Tailwind `@utility` classes, not Angular components
- Components are used only when behavior/state is needed (Input, Select, Dialog, Tabs, etc.)
- Modals use native `<dialog>` element
- Anchored floating elements (dropdowns, tooltips, popovers) use `absolute`/`relative` CSS positioning, with CSS Anchor Positioning (`anchor()`) as upgrade path for edge-flipping or DOM nesting issues
- Icons use Bootstrap Icons via `@ng-icons/bootstrap-icons`
- Custom styles are defined as Tailwind `@utility` directives for IDE IntelliSense and purge support

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
| Hero headline            | `font-display text-5xl md:text-7xl tracking-wider` |
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

### 1.6 Tailwind Utilities

All custom visual styles are defined as Tailwind `@utility` directives in the project's CSS entrypoint. This gives them full Tailwind treatment: IDE IntelliSense, class purging, and composability with other Tailwind classes.

#### Button Utilities

Buttons are native `<button>` elements styled with composable utility classes:

```css
/* Base — applied to every button */
@utility btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 0.3s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Variants */
@utility btn-gold {
  background: var(--gradient-gold);
  box-shadow: var(--shadow-gold);
  color: hsl(var(--primary));
  font-weight: 600;
}
@utility btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px -4px hsl(45 100% 50% / 0.5);
}

@utility btn-outline {
  border: 1px solid hsl(var(--border));
  background: transparent;
  color: hsl(var(--foreground));
}
@utility btn-outline:hover {
  background: hsl(var(--muted));
}

@utility btn-destructive {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}

@utility btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

@utility btn-ghost {
  background: transparent;
  color: hsl(var(--foreground));
}
@utility btn-ghost:hover {
  background: hsl(var(--muted));
}

@utility btn-link {
  background: transparent;
  color: hsl(var(--accent));
  text-decoration: underline;
  padding: 0;
}

/* Sizes */
@utility btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

@utility btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

@utility btn-icon {
  padding: 0.5rem;
  width: 2.25rem;
  height: 2.25rem;
}
```

**Usage:** `<button class="btn btn-gold btn-lg">Submit</button>`

#### Badge Utilities

```css
@utility badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
}

@utility badge-default {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

@utility badge-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

@utility badge-destructive {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}

@utility badge-outline {
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}

@utility badge-accent {
  background: hsl(var(--accent) / 0.1);
  color: hsl(var(--accent));
}
```

**Usage:** `<span class="badge badge-accent">Group A</span>`

#### Label Utility

```css
@utility form-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: hsl(var(--foreground));
}
```

**Usage:** `<label class="form-label" for="email">Email</label>`

#### Separator Utility

```css
@utility separator {
  height: 1px;
  width: 100%;
  background: hsl(var(--border));
}

@utility separator-vertical {
  width: 1px;
  height: 100%;
  background: hsl(var(--border));
}
```

#### Card & Layout Utilities

```css
@utility card-gradient {
  background: var(--gradient-card);
  box-shadow: var(--shadow-card);
}

@utility sidebar-gradient {
  background: var(--gradient-navy);
}

@utility match-card {
  background: hsl(var(--card));
  border-radius: theme(borderRadius.xl);
  padding: theme(spacing.4);
  border: 1px solid hsl(var(--border));
  transition: all 0.3s;
}
@utility match-card:hover {
  border-color: hsl(var(--accent));
  box-shadow: theme(boxShadow.lg);
  transform: translateY(-2px);
}

@utility stat-card {
  background: hsl(var(--card));
  border-radius: theme(borderRadius.xl);
  padding: theme(spacing.6);
  border: 1px solid hsl(var(--border));
}

@utility page-header {
  margin-bottom: theme(spacing.8);
}

@utility page-title {
  font-size: theme(fontSize.3xl);
  font-weight: 700;
  color: hsl(var(--foreground));
  margin-bottom: theme(spacing.2);
}

@utility page-subtitle {
  color: hsl(var(--muted-foreground));
}
```

#### Rank Badge Utilities

```css
@utility rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
}

@utility rank-badge-gold {
  background: var(--gradient-gold);
  color: hsl(var(--primary));
}

@utility rank-badge-silver {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

@utility rank-badge-bronze {
  background: theme(colors.amber.700);
  color: white;
}
```

#### Text Utilities

```css
@utility text-gradient-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 2. Component Library

### 2.0 Angular Glossary

Brief definitions of Angular concepts referenced throughout this section:

- **Standalone component:** An Angular component that declares its own dependencies (imports) and does not need to be part of an `NgModule`. All components in this design system are standalone. Created with `@Component({ standalone: true, ... })`.
- **Directive:** A class that modifies the behavior or appearance of an existing DOM element. Unlike a component, a directive has no template — it attaches to a native element. Example: a `TooltipDirective` applied as `<button appTooltip="Help">` adds tooltip behavior to a plain button without wrapping it in a custom element.
- **Content projection:** Angular's mechanism for passing markup into a component from the outside, using `<ng-content>`. The component defines a slot, and the consumer fills it. Example: `<app-card><h2>Title</h2><p>Body</p></app-card>` where the card component renders the h2 and p inside its own template. Multiple named slots are possible with `<ng-content select="...">`.
- **ControlValueAccessor:** An interface that lets a custom component work as a form control with Angular's reactive forms (`formControlName`, `[formControl]`). It implements `writeValue()`, `registerOnChange()`, and `registerOnTouched()` so the form system can read/write the component's value. Any component that wraps an input interaction (Select, Switch, Slider, etc.) implements this.

### 2.1 Primitives — Form & Input

#### Input
- **Purpose:** Single-line text input
- **Design:** `bg-background border-input rounded-md px-3 py-2 text-sm`. Focus ring uses `--ring` (gold). Styles are baked into the component.
- **Auth variant:** `pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground` with absolute-positioned icon overlay.
- **Angular notes:** Standalone component. Inputs: `type`, `placeholder`, `disabled`. Icon variant via content projection (project an icon into a left slot). Implements `ControlValueAccessor` for reactive form integration.

#### Textarea
- **Purpose:** Multi-line text input
- **Design:** Same base styling as Input but with `min-h-[80px]` and resize handle. Styles baked in.
- **Angular notes:** Standalone component. Implements `ControlValueAccessor`.

#### Checkbox
- **Purpose:** Boolean toggle
- **Design:** Rounded square, accent color when checked, with check icon.
- **Angular notes:** Standalone component wrapping native checkbox with custom visual. Implements `ControlValueAccessor`.

#### Radio Group
- **Purpose:** Single selection from options
- **Design:** Circular indicators, used in ScorerPredictionInput with icon labels, and in Create League for rule selection.
- **Angular notes:** Parent `RadioGroup` component + child `RadioGroupItem`. Implements `ControlValueAccessor` on the group.

#### Select
- **Purpose:** Dropdown selection
- **Design:** Trigger shows selected value with chevron, dropdown panel with scroll. `bg-background` trigger, `bg-popover` content.
- **Angular notes:** Standalone component with `SelectTrigger`, `SelectContent`, `SelectItem` sub-components via content projection. Dropdown positioned with `absolute`/`relative` CSS. Implements `ControlValueAccessor`.

#### Switch
- **Purpose:** On/off toggle
- **Design:** Pill-shaped track, circular thumb, accent color when on. Used in cookie settings dialog.
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

#### FormGroup
- **Purpose:** Unified wrapper for a form field — handles label, control, description, spacing, and validation error display.
- **Design:** Vertical stack with `space-y-2` between label and control. Label styled `text-sm font-medium`. Optional description text in `text-muted-foreground text-sm`. Error text in `text-destructive text-sm`. Consistent row spacing (`mb-4`) between groups.
- **Angular notes:** Standalone component. Inputs: `label`, `description`, `errorMessage` (or auto-derived from the reactive form control's validation state). Projects the form control via `<ng-content>`. Integrates with Angular reactive forms — pass a `FormControl` reference so it can display validation errors automatically.

#### Input OTP
- **Purpose:** One-time password / verification code input
- **Design:** Series of single-character input boxes.
- **Angular notes:** Standalone component with `length` input and `(complete)` output. Implements `ControlValueAccessor`.

#### Calendar / Date Picker
- **Purpose:** Date selection
- **Design:** Month grid with navigation arrows.
- **Angular notes:** Standalone component. Build custom with a day grid — no external dependency needed.

### 2.2 Primitives — Display & Feedback

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
- **Angular notes:** Standalone component with `AlertTitle` and `AlertDescription` via content projection.

#### Toast / Sonner
- **Purpose:** Transient notifications
- **Design:** Slides in from edge with auto-dismiss. Used for success/error/info feedback on save, copy, and invite actions.
- **Angular notes:** Service-based (`ToastService.success()`, `.error()`, `.info()`). Global `<app-toaster>` component in root layout.

#### Aspect Ratio
- **Purpose:** Maintains aspect ratio for media containers
- **Angular notes:** Standalone component wrapping content with CSS `aspect-ratio`.

#### Scroll Area
- **Purpose:** Custom scrollbar container
- **Design:** Thin custom scrollbar track.
- **Angular notes:** Standalone component with custom CSS scrollbar styling.

### 2.3 Primitives — Overlay & Navigation

**Positioning strategy:**

| Element type | Mechanism |
|---|---|
| **Modals** (Dialog, Alert Dialog, Sheet, Drawer) | Native `<dialog>` element |
| **Anchored floating** (Select dropdown, Popover, Tooltip, Dropdown Menu, Hover Card, Context Menu) | `absolute`/`relative` CSS, with CSS `anchor()` as upgrade path for edge-flipping or DOM nesting |

#### Dialog
- **Purpose:** Modal dialog for focused tasks (cookie settings, confirmations)
- **Design:** Centered overlay with backdrop blur. Card-style content.
- **Angular notes:** Standalone component using native `<dialog>` element. `dialog.showModal()` for opening, provides backdrop, focus trapping, and Escape-to-close natively. Sub-components via content projection: `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`.

#### Alert Dialog
- **Purpose:** Confirmation dialogs for destructive actions
- **Design:** Like Dialog but with explicit confirm/cancel buttons.
- **Angular notes:** Same `<dialog>` pattern with required action buttons.

#### Sheet
- **Purpose:** Side panel (slides from edge)
- **Sides:** `top`, `right`, `bottom`, `left`
- **Angular notes:** Standalone component using `<dialog>` with CSS slide animation (transform from off-screen).

#### Drawer
- **Purpose:** Bottom sheet (mobile-friendly)
- **Design:** Slides up from bottom with drag handle.
- **Angular notes:** Standalone component using `<dialog>` with CSS slide-up animation.

#### Popover
- **Purpose:** Floating content anchored to trigger
- **Angular notes:** Standalone component. Content positioned with `absolute` inside a `relative` parent. Content via `ng-template` or content projection.

#### Hover Card
- **Purpose:** Rich tooltip on hover
- **Design:** Card appears on hover with delay.
- **Angular notes:** Standalone component with trigger element and content template. `absolute`/`relative` positioning.

#### Tooltip
- **Purpose:** Simple text tooltip
- **Design:** Small dark tooltip on hover.
- **Angular notes:** Directive applied to any element. `absolute`/`relative` positioning. Example: `<button appTooltip="Help">`.

#### Context Menu
- **Purpose:** Right-click menu
- **Angular notes:** Standalone component wrapping trigger area. Menu items via content projection. `absolute` positioning at cursor coordinates.

#### Dropdown Menu
- **Purpose:** Click-triggered menu
- **Design:** Used in sidebar for user actions.
- **Angular notes:** Standalone component with `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`. `absolute`/`relative` positioning.

#### Command
- **Purpose:** Search/command palette (cmdk pattern)
- **Design:** Input + filterable list of commands/actions.
- **Angular notes:** Standalone component rendered inside a Dialog. Contains search input, `CommandGroup`, `CommandItem`, `CommandEmpty` via content projection.

#### Menubar
- **Purpose:** Horizontal menu bar (app-style menu)
- **Angular notes:** Standalone component with `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`. `absolute`/`relative` positioning for dropdowns.

#### Navigation Menu
- **Purpose:** Site navigation with mega-menu support. Used in Landing page sticky navbar.
- **Angular notes:** Standalone component with `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`.

#### Breadcrumb
- **Purpose:** Hierarchical navigation trail
- **Angular notes:** Standalone component with `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator` via content projection.

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
- **Design:** Default uses `bg-card border-border rounded-xl`. Enhanced variant uses `card-gradient` utility.
- **Auth variant:** `border-primary-foreground/10 bg-card/5 backdrop-blur-md shadow-2xl`
- **Angular notes:** Standalone component with sub-components via content projection. Each sub-component applies its own padding and typography.

#### Accordion
- **Purpose:** Collapsible content sections
- **Design:** Used in Rules page for FAQs. Trigger text left-aligned, chevron rotates. Content animates with `accordion-down`/`accordion-up`.
- **Angular notes:** `Accordion` parent with `type` (`single` | `multiple`), `AccordionItem`, `AccordionTrigger`, `AccordionContent`. Use CSS animations for expand/collapse.

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
- **Angular notes:** Standalone component. `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`.

#### Resizable Panels
- **Purpose:** Draggable split-pane layout
- **Angular notes:** `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.

#### Sidebar
- **Purpose:** Collapsible navigation sidebar
- **Design:** Navy gradient background (`sidebar-gradient` utility), collapses on mobile via trigger button. Fixed on desktop.
- **Sub-components:** `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarTrigger`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
- **Angular notes:** `SidebarProvider` manages open/collapsed state as a service. `SidebarTrigger` toggles on mobile. Menu items use `routerLink` with `routerLinkActive` for active styling.

### 2.5 Domain Components — Fantabet-Specific

#### MatchCard
- **Purpose:** Displays a match with two teams, date/time, optional scores, and phase badge
- **Design:** Uses `match-card` utility. Hover lifts card. Stage badge in `badge badge-accent`. Team flags at `text-2xl`, names at `font-medium text-sm`. Score at `text-xl font-bold`. VS separator when no score.
- **Inputs:** `match: Match`, `showResult: boolean`
- **Used on:** Dashboard (upcoming + recent), Predictions page, Match Detail page
- **Angular notes:** Standalone component.

#### StatsCards
- **Purpose:** Grid of 4 stat cards showing user performance metrics
- **Design:** `grid grid-cols-2 lg:grid-cols-4 gap-4`. Each card uses `stat-card` utility. Icon in colored circle (`w-10 h-10 rounded-lg {bgColor}`), value at `text-2xl font-bold`, label at `text-sm text-muted-foreground`. Staggered fade-in animation.
- **Stats:** Points (gold icon), Rank (navy icon), Accuracy (green icon), Predictions (gray icon)
- **Inputs:** User data (points, rank, accuracy, total predictions)
- **Used on:** Dashboard
- **Angular notes:** Standalone component.

#### RankingCard
- **Purpose:** Compact top-5 leaderboard for dashboard sidebar
- **Design:** `card-gradient` utility. Player rows with rank badge (gold/silver/bronze), name, points. Current user row highlighted with `bg-accent/10 border border-accent/20`. "View Full Ranking" link at bottom.
- **Inputs:** Players array, current user ID
- **Used on:** Dashboard
- **Angular notes:** Standalone component with `routerLink` to full ranking page.

#### TournamentStatus
- **Purpose:** Tournament progress overview
- **Design:** `card-gradient` utility. Progress bar (`h-2`) showing matches played / total. Info grid (`grid grid-cols-2 gap-4`) with matches played and teams remaining in `bg-muted/50 rounded-lg p-3`. Next phase callout in `bg-accent/10 border border-accent/20` with gold text.
- **Inputs:** Tournament status data (stage, matches played/total, teams remaining, next phase, days until)
- **Used on:** Dashboard
- **Angular notes:** Standalone component.

#### ScorerPredictionInput
- **Purpose:** Scorer prediction for knockout matches — select player, own goal, or no goal
- **Design:** Container `p-4 rounded-lg bg-muted/30 border border-border`. Radio group with three options (Player + User icon, Own Goal + Goal icon, No Goal + Ban icon). Conditional Select dropdown appears when "Player" is selected, showing team roster.
- **Inputs:** `match: Match`, `team: 'home' | 'away'`
- **Used on:** Predictions page (knockout matches only), Match Detail page
- **Angular notes:** Standalone component, implements `ControlValueAccessor` for reactive form integration. Value type: `ScorerValue`.

#### Footer
- **Purpose:** Site-wide footer with legal links and cookie preferences
- **Design:** `border-t border-border bg-card/50 py-8 px-6`. Contains copyright text ("© 2026 World Cup Predictor. All rights reserved."), navigation links (Terms & Conditions, Data Protection, Imprint, Cookie Declaration), and a Cookie Settings button. Cookie button opens a Dialog with Switch toggles for cookie categories: Essential (locked on), Analytics (toggleable), Marketing (toggleable). Save button uses `btn btn-gold`.
- **Used on:** DashboardLayout (all authenticated pages), Landing page, legal pages
- **Angular notes:** Standalone component. Cookie dialog uses the Dialog component with Switch components inside.

#### LeagueManagement
- **Purpose:** League cards with member management and invite system
- **Design:** Section header with Users icon and "My Leagues" title. "New League" button linking to `/create-league` with Crown icon. Each league rendered as `card-gradient` card showing: league name with Owner badge (if `isOwner`), tournament name, rule badges (`predictionType`, `timeframeRule`), member list with approval buttons for owners, pending status badges. Owner-only invite section: copy link button (with check confirmation state) + email invite input.
- **Inputs:** Leagues array, current user context
- **Used on:** Profile page
- **Angular notes:** Standalone component. Uses Toast service for copy/invite feedback.

#### DashboardLayout
- **Purpose:** Authenticated page shell — sidebar + header + footer + content area
- **Design:** Full-height flex layout. Header: `h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10`. Sidebar trigger visible only on mobile (`lg:hidden`). Content area: `flex-1 p-6 overflow-auto`. Footer rendered below content area.
- **Angular notes:** Standalone component with `<router-outlet>` for content. Wraps `SidebarProvider`, `AppSidebar`, and `Footer`.

#### AppSidebar
- **Purpose:** Navigation sidebar with logo, menu items, and user profile footer
- **Design:** `sidebar-gradient` utility background. Logo: gold accent square (`w-10 h-10 rounded-xl bg-accent`) with trophy icon + "FANTABET" in Bebas Neue. Menu items: `flex items-center gap-3 px-3 py-2.5 rounded-lg` with slide-in animation (staggered 50ms). Active state: `bg-sidebar-accent text-sidebar-primary font-medium`. Footer: user name with link to profile.
- **Menu items:** Dashboard (Home icon), My Predictions (Edit3), Full Ranking (Trophy), Past Winners (Award), Rules (BookOpen)
- **Angular notes:** Standalone component using `routerLink` and `routerLinkActive` directives.

---

## 3. Page Compositions

### 3.1 Authenticated Pages (DashboardLayout)

#### Dashboard (`/dashboard`)
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
            Button.btn.btn-gold "Save Prediction" | Button.btn.bg-success "Saved"
    TabsContent "knockout"
      Same as group + ScorerPredictionInput for each team
    TabsContent "coming-soon"
      Locked cards (opacity-60, lock icon, "Predictions not yet open")
```

#### Match Detail (`/match/:matchId`)
```
DashboardLayout
  Back link to /predictions (ArrowLeft icon + "Back to Predictions")
  Card.card-gradient (match header)
    Badge row: stage badge, knockout indicator (Trophy icon), status badge (finished/live)
    Calendar + date, Clock + time
    .flex.items-center.justify-center.gap-8
      Home: flag (text-4xl) + team name (text-xl font-bold)
      Score display: "homeScore - awayScore" (text-4xl font-bold) or "vs" (text-2xl text-muted-foreground)
      Away: flag (text-4xl) + team name (text-xl font-bold)
  Card.card-gradient "Your Prediction"
    If prediction exists:
      Predicted score display + Edit button (btn btn-outline btn-sm)
      If knockout: ScorerBadge for home + away scorer predictions
    If no prediction + predictions enabled:
      "No prediction yet" + link to predictions page
    If predictions locked:
      Lock icon + "Predictions are locked"
  Card.card-gradient "Community Predictions" (visible after match starts)
    For each community prediction:
      name + predicted score
      If knockout: scorer prediction badges
    If before match start:
      Lock icon + "Community predictions will be visible after the match starts"
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
    Each: rank-badge (large: w-10 h-10 text-lg),
          name, .text-gradient-gold points, accuracy %
    Current user: ring-2 ring-accent
  Full Table: Card.card-gradient
    For each player (4th onward):
      Row: rank-badge, name, Progress[h-1.5], points, accuracy
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
        Right: .flex-1.p-6 — name (text-xl font-bold), points (Medal icon), world cup winner (Flag icon),
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
    Personal Info Card [delay: 0ms]
      Input[name], Input[email with Mail icon]
      Button[btn btn-gold] "Save Changes"
    Change Password Card [delay: 100ms]
      Input[current password with Lock icon]
      Separator
      Input[new password], Input[confirm password]
      Button[btn btn-outline] "Update Password"
    Account Stats Card [delay: 200ms]
      .grid.grid-cols-3.gap-4.text-center
        Points (text-gradient-gold), Predictions, Accuracy
    LeagueManagement component [delay: 300ms]
```

#### Create League (`/create-league`)
```
DashboardLayout
  .page-header
    .page-title "Create a League"
    .page-subtitle "Set up your private prediction league."

  Step 1 — Form:
    Card.card-gradient
      Input[league name, 50 char limit with counter]
      Select[tournament: "FIFA World Cup 2026", "Euro 2028", "Copa America 2028"]
      RadioGroup "Prediction Rules"
        RadioGroupItem "Results Only" — predict match scores
        RadioGroupItem "Results + Scorer Predictions" — also predict first goalscorer
      RadioGroup "Timeframe Rule"
        RadioGroupItem "Open by Default" — predict anytime before kickoff
        RadioGroupItem "24-Hour Window" — predictions lock 24h before match
      Button[btn btn-gold] "Create League"

  Step 2 — Success:
    Card.card-gradient.text-center
      Check icon in green circle
      "League Created!" heading
      Shareable link with copy button (Copy icon → Check icon on copy)
      Email invite: Input + Button[btn btn-gold btn-sm] "Send"
      Invited list: names with badge-secondary "Invited" badges
      Button[btn btn-gold] "Go to Dashboard"
```

### 3.2 Public Pages (No DashboardLayout)

#### Landing (`/`)
```
.min-h-screen
  Sticky Navbar: .sticky.top-0.z-50.bg-primary/95.backdrop-blur-sm
    .container.mx-auto.flex.items-center.justify-between.px-6.py-4
      Logo: Trophy icon + "WORLD CUP PREDICTOR" (font-display tracking-wider text-primary-foreground)
      Nav buttons: Button[btn btn-ghost text-primary-foreground] "Login"
                   Button[btn btn-gold] "Sign Up"

  Hero Section: .bg-primary.py-20.md:py-32.text-center
    "Predict." "Compete." "Dominate." (font-display text-5xl md:text-7xl text-primary-foreground)
    "Dominate." uses text-gradient-gold
    Subtitle: text-primary-foreground/60
    Two CTAs: Button[btn btn-gold btn-lg] "Create a League"
              Button[btn btn-outline border-primary-foreground/20 text-primary-foreground btn-lg] "Join an Existing League"

  Features Section: .py-20.bg-background
    Section title + subtitle
    .grid.md:grid-cols-2.lg:grid-cols-4.gap-6
      4 feature cards [card-gradient, animate-fade-in staggered]:
        Icon circle (bg-accent/10, icon text-accent)
        Title (font-semibold)
        Description (text-sm text-muted-foreground)
      Features: Predict Match Results, Create Private Leagues, Scorer Predictions, Flexible Prediction Rules

  How It Works Section: .py-20.bg-muted/50
    4 numbered steps [animate-fade-in staggered]:
      Step number: "01"–"04" (font-display text-4xl text-accent)
      Title (text-xl font-bold)
      Description (text-muted-foreground)

  CTA Section: .bg-primary.py-20.text-center
    "Ready to Start Your League?" (font-display text-4xl text-primary-foreground)
    Button[btn btn-gold btn-lg] "Get Started"

  Footer
```

#### Login (`/login`)
```
.min-h-screen.bg-primary.flex.items-center.justify-center.p-4
  .w-full.max-w-md.space-y-8
    Logo: gold circle + trophy + "FANTABET" (font-display text-4xl) + subtitle
    Card [backdrop-blur-md, bg-card/5, shadow-2xl]
      "Sign In" title
      Input[email, with Mail icon, auth variant]
      Input[password, with Lock icon, auth variant]
      "Forgot password?" link (text-accent) → /forgot-password
      Button[btn btn-gold w-full] "Sign In"
      "Don't have an account? Sign up" link
    Legal links footer: Terms, Privacy, Imprint (text-primary-foreground/40)
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
      Button[btn btn-gold w-full] "Create Account"
      "Already have an account? Sign in" link
    Legal links footer
```

#### Forgot Password (`/forgot-password`)
```
.min-h-screen.bg-primary.flex.items-center.justify-center.p-4
  .w-full.max-w-md.space-y-8
    Logo: same as Login
    Card [same auth styling]
      State 1 — Form:
        "Forgot Password" title
        "Enter your email to receive a reset link" description
        Input[email, with Mail icon, auth variant]
        Button[btn btn-gold w-full] "Send Reset Link"
      State 2 — Confirmation:
        Mail icon (large, text-accent)
        "Check Your Email" title
        "We've sent a reset link to {email}" description
        Button[btn btn-outline text-primary-foreground] "Try again"
      "Back to Sign In" link
    Legal links footer
```

#### Legal Pages (`/terms`, `/privacy`, `/imprint`, `/cookies`)
```
.min-h-screen.bg-background
  .container.mx-auto.max-w-3xl.py-12.px-6
    Back link to Landing
    .page-title "{Page Title}"
    .text-sm.text-muted-foreground "Last updated: April 2026"
    .prose (standard prose styling for legal content)
      Sections with h2 headings and body paragraphs
  Footer
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
| Landing hero | `text-5xl`, stacked CTAs | `text-7xl`, inline CTAs |
| Landing features | 1 column | 4 columns |

### 3.4 Shared Patterns

- **Page header:** Every authenticated page uses `page-header` > `page-title` + `page-subtitle` utilities
- **Section titles:** `text-lg font-semibold flex items-center gap-2` with accent-colored icon
- **Staggered animations:** Lists and grids use `animate-fade-in` with `animation-delay: index * 100ms`
- **Current user highlight:** `bg-accent/10 border border-accent/20` wherever the current user appears in a list
- **Card containers:** Most content blocks use `card-gradient` utility
- **Gold CTA:** Primary actions use `btn btn-gold`, secondary actions use `btn btn-outline`
- **Auth page layout:** All auth pages (Login, Register, Forgot Password) share: `min-h-screen bg-primary`, centered `max-w-md` card with backdrop blur, shared logo block, legal links footer
- **Footer:** Present on all pages — inside DashboardLayout for authenticated pages, standalone for public/legal pages

---

## 4. Data Models

These interfaces define the domain data flowing through components. They should be defined as TypeScript interfaces in the Angular project's shared models.

> **Note:** These interfaces are provisional view models for initial component development. The domain model (User as a base for Player/Winner/LeagueMember, Scorer as a tournament team player, Tournament as a richer entity than TournamentStatus) will be designed separately and these types will be refactored to align with it.

```typescript
interface Player {
  id: string;
  name: string;
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

interface LeagueMember {
  id: string;
  name: string;
  status: 'active' | 'pending';
}

interface League {
  id: string;
  name: string;
  tournament: string;
  predictionType: string;
  timeframeRule: string;
  inviteLink: string;
  members: LeagueMember[];
  isOwner: boolean;
}
```

**Utility functions:**

```typescript
function isKnockoutPhase(phase: Match['phase']): boolean;
function getPhaseLabel(phase: Match['phase']): string;
```

---

## 5. Icon Library

The project uses **Bootstrap Icons** via the `@ng-icons/bootstrap-icons` package.

**Icon mapping from prototype (Lucide → Bootstrap Icons equivalent):**

| Prototype Icon   | Usage                                  |
|------------------|----------------------------------------|
| Home             | Dashboard nav                          |
| Edit3            | Predictions nav                        |
| Trophy           | Ranking nav, logos, winners, stats     |
| Award            | Winners nav                            |
| BookOpen         | Rules nav                              |
| Medal            | Points display                         |
| Target           | Accuracy stat                          |
| TrendingUp       | Predictions stat                       |
| Calendar         | Match dates                            |
| Clock            | Match times                            |
| ChevronRight     | Links, navigation                      |
| ChevronLeft      | Back navigation                        |
| ArrowLeft        | Back to predictions (Match Detail)     |
| User / Users     | Profile, player selection, leagues     |
| Mail             | Email input icon, forgot password      |
| Lock             | Password input icon, locked predictions|
| Save             | Save prediction                        |
| Check            | Saved state, copy confirmation         |
| AlertTriangle    | Important notice                       |
| Ban              | No goal option                         |
| Goal             | Own goal option                        |
| Star             | Highlights                             |
| Settings         | Profile nav                            |
| LogOut           | Sidebar footer                         |
| Crown            | New league button                      |
| Copy / Link      | Copy invite link                       |
| Cookie           | Cookie settings button                 |
| Shield           | Privacy page                           |
| FileText         | Terms page                             |

Exact Bootstrap Icons names should be mapped during implementation (e.g., Lucide `Trophy` → `bi-trophy`, Lucide `Home` → `bi-house`).


# Design System Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Recommended execution:** Subagent-driven — dispatch a fresh subagent per task with two-stage review between tasks.

**Goal:** Build the complete GoalCast design system as reusable Angular components and Tailwind utilities, ready for page-level composition.

**Architecture:** Standalone Angular components with Tailwind v4 `@utility` directives for visual-only styles. Behavioral components (Dialog, Tabs, Sidebar, etc.) are Angular components. All components are headless-first — minimal internal state, inputs/outputs for external control.

**Tech Stack:** Angular 21, Tailwind CSS v4, Angular signals (for component state), Bootstrap Icons via `@ng-icons/bootstrap-icons`, Vitest for testing.

**Specs:**
- Design system: `docs/superpowers/specs/2026-04-02-fantabet-design-system-design.md`
- Profile & flow: `docs/superpowers/specs/2026-04-04-profile-and-application-flow-design.md`

**Shell note:** `cd` is overridden by zoxide on this machine. Always use `builtin cd` for directory changes.

**Component convention:** Every component MUST use a separate `<name>.component.html` template file with `templateUrl`, never inline `template:`. The only exception is trivial pass-through sub-components (e.g., `CardHeaderComponent`) that have only `'<ng-content />'` as their template — these may use inline `template`.

**What's already built:**
- `styles.scss` — design tokens (CSS vars), button classes in `@layer components`, card classes, sidebar gradient, rank badges, page headers. Missing: badge, label, separator, form-label utilities.
- `InputFieldComponent` — shared form input with validation. Uses Heroicons (needs switch to Bootstrap Icons). Has debug `console.log` to remove.
- `LoginComponent`, `RegisterComponent`, `DashboardComponent` — exist but minimal. Not in scope to modify (page-level).

**What's NOT in scope:**
- Page components (Landing, Login, Register, Profile, Dashboard pages)
- Routing, guards, navigation logic
- Backend API integration, NGRx state for leagues
- Domain/app-specific components (AppSidebar, DashboardLayout, Footer, MatchCard, StatsCards, RankingCard, TournamentStatus, LeagueCard) — these will be built when composing pages
- LeagueEditModal (requires backend wiring for members/invites)
- Primitives deferred to a future plan: Calendar/Date Picker, Sheet, Breadcrumb, Carousel, Resizable Panels, Aspect
  Ratio

---

### Task 1: Update styles.scss — Add Missing Utilities

**Files:**
- Modify: `frontend/src/styles.scss`

The current `styles.scss` has buttons, cards, sidebar gradient, and rank badges in `@layer components`. The spec defines additional utilities that are missing: `badge`, `form-label`, `separator`. Add them.

- [ ] **Step 1: Add badge utilities to styles.scss**

Add after the `@utility text-gradient-gold` block at the end of the file:

```scss
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

@utility badge-success {
  background: hsl(var(--success));
  color: hsl(var(--success-foreground));
}
```

- [ ] **Step 2: Add form-label and separator utilities**

Add after the badge utilities:

```scss
@utility form-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: hsl(var(--foreground));
}

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

- [ ] **Step 3: Verify build succeeds**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/styles.scss
git commit -m "feat(design-system): add badge, form-label, separator utilities"
```

---

### Task 2: Switch Icon Library to Bootstrap Icons

**Files:**
- Modify: `frontend/package.json` (via npm)
- Modify: `frontend/src/app/shared/components/input/input-field.component.ts`
- Modify: `frontend/src/app/shared/components/input/input-field.component.html`

The spec requires Bootstrap Icons via `@ng-icons/bootstrap-icons`. Currently using `@ng-icons/heroicons`.

- [ ] **Step 1: Install bootstrap-icons, uninstall heroicons**

Run:
```bash
builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npm install @ng-icons/bootstrap-icons && npm uninstall @ng-icons/heroicons
```

Expected: Both succeed. `package.json` shows `@ng-icons/bootstrap-icons` in dependencies, `@ng-icons/heroicons` removed.

- [ ] **Step 2: Update InputFieldComponent to use Bootstrap Icons**

Replace the icon import and provider in `frontend/src/app/shared/components/input/input-field.component.ts`:

```typescript
import {Component, computed, input, Signal} from '@angular/core';
import {FormControl, FormControlStatus, ReactiveFormsModule} from '@angular/forms';
import {bootstrapExclamationCircle} from '@ng-icons/bootstrap-icons';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {NgClass} from '@angular/common';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';

const ERROR_MESSAGES: Record<string, (params?: any) => string> = {
  required: () => 'This field is required',
  email: () => 'Please enter a valid email',
  minlength: (p) => `Minimum ${p.requiredLength} characters`,
  maxlength: (p) => `Maximum ${p.requiredLength} characters`,
  pattern: () => 'Invalid format',
};

@Component({
  selector: 'fb-input-field',
  templateUrl: './input-field.component.html',
  imports: [ReactiveFormsModule, NgIcon, NgClass],
  viewProviders: [provideIcons({bootstrapExclamationCircle})]
})
export class InputFieldComponent {
  control = input.required<FormControl>();
  status: Signal<FormControlStatus> = toSignal(
    toObservable(this.control).pipe(switchMap(c => c.statusChanges)),
    {initialValue: 'VALID'}
  );
  error = computed(() => {
    this.status();
    const ctrl = this.control();
    if (!ctrl.errors || !ctrl.touched) {
      return null;
    }
    const firstKey = Object.keys(ctrl.errors)[0];
    const messageFn = ERROR_MESSAGES[firstKey];
    return messageFn ? messageFn(ctrl.errors[firstKey]) : 'Invalid value';
  });
  inputId = input.required<string>();
  label = input.required<string>();
  type = input.required<'text' | 'password' | 'email' | 'number'>();
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  autocomplete = computed<string>(() => this.type() === 'password' ? 'off' : 'on');
}
```

Key changes: import `bootstrapExclamationCircle` instead of `heroExclamationCircle`, remove `console.log`, remove commented code.

- [ ] **Step 3: Update the template icon name**

In `frontend/src/app/shared/components/input/input-field.component.html`, change the icon name:

Replace: `<ng-icon name="heroExclamationCircle"/>`
With: `<ng-icon name="bootstrapExclamationCircle"/>`

- [ ] **Step 4: Verify build succeeds**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/app/shared/components/input/
git commit -m "feat(design-system): switch from heroicons to bootstrap-icons"
```

---

### Task 3: Data Models

**Files:**
- Create: `frontend/src/app/shared/models/match.model.ts`
- Create: `frontend/src/app/shared/models/player.model.ts`
- Create: `frontend/src/app/shared/models/league.model.ts`
- Create: `frontend/src/app/shared/models/tournament.model.ts`

Define all domain interfaces needed by components. These come from the design system spec section 4. Note: these are provisional view models — the domain model will be designed separately and these types will be refactored.

- [ ] **Step 1: Create match model**

Create `frontend/src/app/shared/models/match.model.ts`:

```typescript
export interface Scorer {
  id: string;
  name: string;
  team: string;
  number: number;
}

export interface ScorerValue {
  type: 'player' | 'own_goal' | 'no_goal' | null;
  playerId?: string;
}

export type MatchPhase = 'group' | 'round16' | 'quarter' | 'semi' | 'final';
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
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
  phase: MatchPhase;
  status: MatchStatus;
  predictionsEnabled: boolean;
  homePlayers?: Scorer[];
  awayPlayers?: Scorer[];
}

export function isKnockoutPhase(phase: MatchPhase): boolean {
  return phase !== 'group';
}

export function getPhaseLabel(phase: MatchPhase): string {
  const labels: Record<MatchPhase, string> = {
    group: 'Group Stage',
    round16: 'Round of 16',
    quarter: 'Quarter Final',
    semi: 'Semi Final',
    final: 'Final',
  };
  return labels[phase];
}
```

- [ ] **Step 2: Create player model**

Create `frontend/src/app/shared/models/player.model.ts`:

```typescript
export interface Player {
  id: string;
  name: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}

export interface Winner {
  year: number;
  name: string;
  points: number;
  worldCupWinner: string;
}
```

- [ ] **Step 3: Create league model**

Create `frontend/src/app/shared/models/league.model.ts`:

```typescript
export type LeagueRole = 'ADMIN' | 'MEMBER' | 'PENDING';

export interface LeagueMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending';
}

export interface League {
  id: string;
  slug: string;
  name: string;
  tournament: string;
  predictionType: string;
  timeframeRule: string;
  inviteLink: string;
  members: LeagueMember[];
  isOwner: boolean;
}

export interface LeagueWithMembership {
  slug: string;
  name: string;
  tournament: string;
  memberCount: number;
  role: LeagueRole;
}
```

- [ ] **Step 4: Create tournament model**

Create `frontend/src/app/shared/models/tournament.model.ts`:

```typescript
export interface TournamentStatus {
  currentStage: string;
  matchesPlayed: number;
  totalMatches: number;
  teamsRemaining: number;
  nextPhase: string;
  daysUntilNextPhase: number;
}
```

- [ ] **Step 5: Create barrel export**

Create `frontend/src/app/shared/models/index.ts`:

```typescript
export * from './user.model';
export * from './match.model';
export * from './player.model';
export * from './league.model';
export * from './tournament.model';
```

- [ ] **Step 6: Verify build succeeds**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/shared/models/
git commit -m "feat(design-system): add domain data models"
```

---

### Task 4: Card Component

**Files:**
- Create: `frontend/src/app/shared/components/card/card.component.ts`
- Create: `frontend/src/app/shared/components/card/card.component.spec.ts`

The Card is the most-used component in the design system. It uses content projection with sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter. The sub-components are trivial pass-through wrappers so inline `template: '<ng-content />'` is acceptable.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/card/card.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent} from './card.component';

@Component({
  template: `
    <fb-card>
      <fb-card-header>
        <fb-card-title>Test Title</fb-card-title>
        <fb-card-description>Test Description</fb-card-description>
      </fb-card-header>
      <fb-card-content>Body content</fb-card-content>
      <fb-card-footer>Footer content</fb-card-footer>
    </fb-card>
  `,
  imports: [CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent],
})
class TestHostComponent {}

describe('CardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render card with all sub-components', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('fb-card')).toBeTruthy();
    expect(el.querySelector('fb-card-title')?.textContent).toContain('Test Title');
    expect(el.querySelector('fb-card-description')?.textContent).toContain('Test Description');
    expect(el.querySelector('fb-card-content')?.textContent).toContain('Body content');
    expect(el.querySelector('fb-card-footer')?.textContent).toContain('Footer content');
  });

  it('should apply card styling classes', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('fb-card') as HTMLElement;
    expect(card.classList.contains('bg-card')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Card component**

Create `frontend/src/app/shared/components/card/card.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
  selector: 'fb-card',
  host: {class: 'bg-card text-card-foreground rounded-xl border border-border block'},
  template: '<ng-content />',
})
export class CardComponent {}

@Component({
  selector: 'fb-card-header',
  host: {class: 'flex flex-col gap-1.5 p-6 block'},
  template: '<ng-content />',
})
export class CardHeaderComponent {}

@Component({
  selector: 'fb-card-title',
  host: {class: 'text-lg font-semibold leading-none tracking-tight block'},
  template: '<ng-content />',
})
export class CardTitleComponent {}

@Component({
  selector: 'fb-card-description',
  host: {class: 'text-sm text-muted-foreground block'},
  template: '<ng-content />',
})
export class CardDescriptionComponent {}

@Component({
  selector: 'fb-card-content',
  host: {class: 'p-6 pt-0 block'},
  template: '<ng-content />',
})
export class CardContentComponent {}

@Component({
  selector: 'fb-card-footer',
  host: {class: 'flex items-center p-6 pt-0 block'},
  template: '<ng-content />',
})
export class CardFooterComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/card/
git commit -m "feat(design-system): add Card component with sub-components"
```

---

### Task 5: Dialog Component

**Files:**
- Create: `frontend/src/app/shared/components/dialog/dialog.component.ts`
- Create: `frontend/src/app/shared/components/dialog/dialog.component.html`
- Create: `frontend/src/app/shared/components/dialog/dialog.component.spec.ts`

Uses native `<dialog>` element per the spec. Provides backdrop, focus trapping, and Escape-to-close natively.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/dialog/dialog.component.spec.ts`:

```typescript
import {Component, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent} from './dialog.component';

@Component({
  template: `
    <fb-dialog #dialog>
      <fb-dialog-header>
        <fb-dialog-title>My Dialog</fb-dialog-title>
        <fb-dialog-description>A description</fb-dialog-description>
      </fb-dialog-header>
      <p>Content</p>
      <fb-dialog-footer>
        <button (click)="dialog.close()">Close</button>
      </fb-dialog-footer>
    </fb-dialog>
    <button (click)="dialog.open()">Open</button>
  `,
  imports: [DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent],
})
class TestHostComponent {
  dialog = viewChild.required<DialogComponent>('dialog');
}

describe('DialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should be closed by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it('should open when open() is called', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.dialog().open();
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
  });

  it('should close when close() is called', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance.dialog();
    comp.open();
    comp.close();
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
  });

  it('should render sub-components', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fb-dialog-title')?.textContent).toContain('My Dialog');
    expect(el.querySelector('fb-dialog-description')?.textContent).toContain('A description');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Dialog component**

Create `frontend/src/app/shared/components/dialog/dialog.component.html`:

```html
<dialog
  #dialogEl
  class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
  (close)="closed.emit()"
>
  <div class="p-6">
    <ng-content />
  </div>
</dialog>
```

Create `frontend/src/app/shared/components/dialog/dialog.component.ts`:

```typescript
import {Component, ElementRef, output, viewChild} from '@angular/core';

@Component({
  selector: 'fb-dialog',
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  closed = output<void>();

  open(): void {
    this.dialogEl().nativeElement.showModal();
  }

  close(): void {
    this.dialogEl().nativeElement.close();
  }

  get isOpen(): boolean {
    return this.dialogEl().nativeElement.open;
  }
}

@Component({
  selector: 'fb-dialog-header',
  host: {class: 'flex flex-col gap-1.5 mb-4 block'},
  template: '<ng-content />',
})
export class DialogHeaderComponent {}

@Component({
  selector: 'fb-dialog-title',
  host: {class: 'text-lg font-semibold leading-none tracking-tight block'},
  template: '<ng-content />',
})
export class DialogTitleComponent {}

@Component({
  selector: 'fb-dialog-description',
  host: {class: 'text-sm text-muted-foreground block'},
  template: '<ng-content />',
})
export class DialogDescriptionComponent {}

@Component({
  selector: 'fb-dialog-footer',
  host: {class: 'flex justify-end gap-2 mt-6 block'},
  template: '<ng-content />',
})
export class DialogFooterComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/dialog/
git commit -m "feat(design-system): add Dialog component using native dialog element"
```

---

### Task 6: Tabs Component

**Files:**
- Create: `frontend/src/app/shared/components/tabs/tabs.component.ts`
- Create: `frontend/src/app/shared/components/tabs/tabs.component.spec.ts`

Used in League Edit Modal (2 tabs), Predictions page (3 tabs). Sub-components are trivial pass-through wrappers except TabsTrigger and TabsContent which have logic — but their templates are still just `<ng-content />` so inline template is acceptable.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/tabs/tabs.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent} from './tabs.component';

@Component({
  template: `
    <fb-tabs value="tab1">
      <fb-tabs-list>
        <fb-tabs-trigger value="tab1">Tab 1</fb-tabs-trigger>
        <fb-tabs-trigger value="tab2">Tab 2</fb-tabs-trigger>
      </fb-tabs-list>
      <fb-tabs-content value="tab1">Content 1</fb-tabs-content>
      <fb-tabs-content value="tab2">Content 2</fb-tabs-content>
    </fb-tabs>
  `,
  imports: [TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent],
})
class TestHostComponent {}

describe('TabsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should show active tab content and hide inactive', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const contents = el.querySelectorAll('fb-tabs-content');
    expect(contents[0].classList.contains('hidden')).toBe(false);
    expect(contents[1].classList.contains('hidden')).toBe(true);
  });

  it('should switch tabs on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('fb-tabs-trigger') as NodeListOf<HTMLElement>;
    triggers[1].click();
    fixture.detectChanges();
    const contents = fixture.nativeElement.querySelectorAll('fb-tabs-content');
    expect(contents[0].classList.contains('hidden')).toBe(true);
    expect(contents[1].classList.contains('hidden')).toBe(false);
  });

  it('should mark active trigger', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('fb-tabs-trigger') as NodeListOf<HTMLElement>;
    expect(triggers[0].getAttribute('data-state')).toBe('active');
    expect(triggers[1].getAttribute('data-state')).toBe('inactive');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Tabs component**

Create `frontend/src/app/shared/components/tabs/tabs.component.ts`:

```typescript
import {Component, computed, inject, input, model, signal} from '@angular/core';

const TABS_CONTEXT = Symbol('TabsContext');

export class TabsContext {
  activeValue = signal('');

  select(value: string): void {
    this.activeValue.set(value);
  }
}

@Component({
  selector: 'fb-tabs',
  host: {class: 'block'},
  template: '<ng-content />',
  providers: [{provide: TABS_CONTEXT, useFactory: () => new TabsContext()}],
})
export class TabsComponent {
  private context = inject(TABS_CONTEXT);
  value = model.required<string>();

  ngOnInit(): void {
    this.context.activeValue.set(this.value());
  }
}

@Component({
  selector: 'fb-tabs-list',
  host: {class: 'inline-flex items-center gap-1 border-b border-border w-full block'},
  template: '<ng-content />',
})
export class TabsListComponent {}

@Component({
  selector: 'fb-tabs-trigger',
  host: {
    class: 'inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors',
    '[attr.data-state]': 'isActive() ? "active" : "inactive"',
    '[class.border-b-2]': 'isActive()',
    '[class.border-primary]': 'isActive()',
    '[class.text-foreground]': 'isActive()',
    '[class.text-muted-foreground]': '!isActive()',
    '(click)': 'onClick()',
  },
  template: '<ng-content />',
})
export class TabsTriggerComponent {
  private context = inject(TABS_CONTEXT);
  value = input.required<string>();
  isActive = computed(() => this.context.activeValue() === this.value());

  onClick(): void {
    this.context.select(this.value());
  }
}

@Component({
  selector: 'fb-tabs-content',
  host: {
    class: 'mt-4 block',
    '[class.hidden]': '!isActive()',
  },
  template: '<ng-content />',
})
export class TabsContentComponent {
  private context = inject(TABS_CONTEXT);
  value = input.required<string>();
  isActive = computed(() => this.context.activeValue() === this.value());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/tabs/
git commit -m "feat(design-system): add Tabs component with trigger and content"
```

---

### Task 7: Progress Component

**Files:**
- Create: `frontend/src/app/shared/components/progress/progress.component.ts`
- Create: `frontend/src/app/shared/components/progress/progress.component.html`
- Create: `frontend/src/app/shared/components/progress/progress.component.spec.ts`

Visual progress bar used in tournament status and ranking accuracy.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/progress/progress.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {ProgressComponent} from './progress.component';

describe('ProgressComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
    }).compileComponents();
  });

  it('should render with correct width percentage', () => {
    const fixture = TestBed.createComponent(ProgressComponent);
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
    expect(fill.style.width).toBe('75%');
  });

  it('should clamp value between 0 and 100', () => {
    const fixture = TestBed.createComponent(ProgressComponent);
    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should default to 0', () => {
    const fixture = TestBed.createComponent(ProgressComponent);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('[data-fill]') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Progress component**

Create `frontend/src/app/shared/components/progress/progress.component.html`:

```html
<div
  data-fill
  class="h-full bg-accent rounded-full transition-all duration-300"
  [style.width.%]="clampedValue()"
></div>
```

Create `frontend/src/app/shared/components/progress/progress.component.ts`:

```typescript
import {Component, computed, input} from '@angular/core';

@Component({
  selector: 'fb-progress',
  host: {class: 'block w-full bg-secondary rounded-full overflow-hidden'},
  templateUrl: './progress.component.html',
  styles: `:host { height: 0.5rem; }`,
})
export class ProgressComponent {
  value = input<number>(0);
  clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/progress/
git commit -m "feat(design-system): add Progress bar component"
```

---

### Task 8: Toast Service

**Files:**
- Create: `frontend/src/app/shared/components/toast/toast.service.ts`
- Create: `frontend/src/app/shared/components/toast/toast.component.ts`
- Create: `frontend/src/app/shared/components/toast/toast.component.html`
- Create: `frontend/src/app/shared/components/toast/toast.service.spec.ts`

Service-based transient notifications used for copy/invite/save feedback.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/toast/toast.service.spec.ts`:

```typescript
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {ToastService} from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should add a toast on success()', () => {
    service.success('Saved!');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Saved!');
  });

  it('should add a toast on error()', () => {
    service.error('Something went wrong');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should auto-dismiss after duration', fakeAsync(() => {
    service.success('Temporary', 1000);
    expect(service.toasts().length).toBe(1);
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should allow manual dismiss', () => {
    service.success('Dismissable');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Toast service**

Create `frontend/src/app/shared/components/toast/toast.service.ts`:

```typescript
import {Injectable, signal} from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

@Injectable({providedIn: 'root'})
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 4000): void {
    this.add('success', message, duration);
  }

  error(message: string, duration = 6000): void {
    this.add('error', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.add('info', message, duration);
  }

  dismiss(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string, duration: number): void {
    const id = crypto.randomUUID();
    this._toasts.update(toasts => [...toasts, {id, type, message}]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
```

- [ ] **Step 4: Implement Toaster component**

Create `frontend/src/app/shared/components/toast/toast.component.html`:

```html
<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
  @for (toast of toastService.toasts(); track toast.id) {
    <div
      class="flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-fade-in"
      [class.bg-card]="toast.type === 'info'"
      [class.bg-success]="toast.type === 'success'"
      [class.text-success-foreground]="toast.type === 'success'"
      [class.bg-destructive]="toast.type === 'error'"
      [class.text-destructive-foreground]="toast.type === 'error'"
    >
      @switch (toast.type) {
        @case ('success') { <ng-icon name="bootstrapCheckCircle" class="text-lg shrink-0" /> }
        @case ('error') { <ng-icon name="bootstrapExclamationTriangle" class="text-lg shrink-0" /> }
        @case ('info') { <ng-icon name="bootstrapInfoCircle" class="text-lg shrink-0" /> }
      }
      <span class="text-sm flex-1">{{ toast.message }}</span>
      <button class="shrink-0 cursor-pointer" (click)="toastService.dismiss(toast.id)">
        <ng-icon name="bootstrapX" class="text-lg" />
      </button>
    </div>
  }
</div>
```

Create `frontend/src/app/shared/components/toast/toast.component.ts`:

```typescript
import {Component, inject} from '@angular/core';
import {ToastService} from './toast.service';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapCheckCircle, bootstrapExclamationTriangle, bootstrapInfoCircle, bootstrapX} from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'fb-toaster',
  imports: [NgIcon],
  viewProviders: [provideIcons({bootstrapCheckCircle, bootstrapExclamationTriangle, bootstrapInfoCircle, bootstrapX})],
  templateUrl: './toast.component.html',
})
export class ToasterComponent {
  toastService = inject(ToastService);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/toast/
git commit -m "feat(design-system): add Toast service and Toaster component"
```

---

### Task 9: Sidebar Component

**Files:**
- Create: `frontend/src/app/shared/components/sidebar/sidebar.component.ts`
- Create: `frontend/src/app/shared/components/sidebar/sidebar.component.html`
- Create: `frontend/src/app/shared/components/sidebar/sidebar.component.spec.ts`

Navy gradient sidebar with collapsible mobile behavior. Uses a service for open/close state. Sub-components (SidebarHeader, SidebarContent, SidebarFooter) are trivial pass-through wrappers.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/sidebar/sidebar.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent, SidebarService} from './sidebar.component';

@Component({
  template: `
    <fb-sidebar>
      <fb-sidebar-header>Logo</fb-sidebar-header>
      <fb-sidebar-content>Nav items</fb-sidebar-content>
      <fb-sidebar-footer>User</fb-sidebar-footer>
    </fb-sidebar>
  `,
  imports: [SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent],
  providers: [SidebarService],
})
class TestHostComponent {}

describe('SidebarComponent', () => {
  let sidebarService: SidebarService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    sidebarService = TestBed.inject(SidebarService);
  });

  it('should render sidebar with sub-components', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fb-sidebar-header')?.textContent).toContain('Logo');
    expect(el.querySelector('fb-sidebar-content')?.textContent).toContain('Nav items');
    expect(el.querySelector('fb-sidebar-footer')?.textContent).toContain('User');
  });

  it('should toggle open state via service', () => {
    expect(sidebarService.isOpen()).toBe(true);
    sidebarService.toggle();
    expect(sidebarService.isOpen()).toBe(false);
    sidebarService.toggle();
    expect(sidebarService.isOpen()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Sidebar component**

Create `frontend/src/app/shared/components/sidebar/sidebar.component.html`:

```html
<aside
  class="sidebar-gradient text-sidebar-foreground h-full flex flex-col transition-transform duration-300 w-64"
  [class.-translate-x-full]="!sidebarService.isOpen()"
  [class.translate-x-0]="sidebarService.isOpen()"
>
  <ng-content />
</aside>
```

Create `frontend/src/app/shared/components/sidebar/sidebar.component.ts`:

```typescript
import {Component, Injectable, inject, signal} from '@angular/core';

@Injectable()
export class SidebarService {
  private _isOpen = signal(true);
  readonly isOpen = this._isOpen.asReadonly();

  toggle(): void {
    this._isOpen.update(v => !v);
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}

@Component({
  selector: 'fb-sidebar',
  host: {class: 'block'},
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);
}

@Component({
  selector: 'fb-sidebar-header',
  host: {class: 'p-4 border-b border-sidebar-border block'},
  template: '<ng-content />',
})
export class SidebarHeaderComponent {}

@Component({
  selector: 'fb-sidebar-content',
  host: {class: 'flex-1 overflow-y-auto p-4 block'},
  template: '<ng-content />',
})
export class SidebarContentComponent {}

@Component({
  selector: 'fb-sidebar-footer',
  host: {class: 'p-4 border-t border-sidebar-border block'},
  template: '<ng-content />',
})
export class SidebarFooterComponent {}

@Component({
  selector: 'fb-sidebar-trigger',
  host: {
    class: 'lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md cursor-pointer',
    '(click)': 'sidebarService.toggle()',
  },
  template: '<ng-content />',
})
export class SidebarTriggerComponent {
  sidebarService = inject(SidebarService);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/sidebar/
git commit -m "feat(design-system): add Sidebar component with service-based toggle"
```

---

### Task 10: Textarea Component

**Files:**
- Create: `frontend/src/app/shared/components/textarea/textarea.component.ts`
- Create: `frontend/src/app/shared/components/textarea/textarea.component.html`
- Create: `frontend/src/app/shared/components/textarea/textarea.component.spec.ts`

Multi-line text input. Same base styling as Input but with `min-h-[80px]` and resize handle. Implements `ControlValueAccessor`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/textarea/textarea.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {TextareaComponent} from './textarea.component';

@Component({
  template: `<fb-textarea [formControl]="ctrl" placeholder="Enter text"></fb-textarea>`,
  imports: [TextareaComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('');
}

describe('TextareaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render a textarea element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea).toBeTruthy();
  });

  it('should bind value via formControl', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue('Hello world');
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hello world');
  });

  it('should emit changes to formControl', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'New value';
    textarea.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.ctrl.value).toBe('New value');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Textarea component**

Create `frontend/src/app/shared/components/textarea/textarea.component.html`:

```html
<textarea
  class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
  [placeholder]="placeholder()"
  [disabled]="isDisabled()"
  [value]="value()"
  (input)="onInput($event)"
  (blur)="onTouched()"
></textarea>
```

Create `frontend/src/app/shared/components/textarea/textarea.component.ts`:

```typescript
import {Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'fb-textarea',
  templateUrl: './textarea.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TextareaComponent),
    multi: true,
  }],
})
export class TextareaComponent implements ControlValueAccessor {
  placeholder = input('');
  value = signal('');
  isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/textarea/
git commit -m "feat(design-system): add Textarea component with ControlValueAccessor"
```

---

### Task 11: Checkbox Component

**Files:**
- Create: `frontend/src/app/shared/components/checkbox/checkbox.component.ts`
- Create: `frontend/src/app/shared/components/checkbox/checkbox.component.html`
- Create: `frontend/src/app/shared/components/checkbox/checkbox.component.spec.ts`

Boolean toggle with custom visual. Wraps native checkbox. Implements `ControlValueAccessor`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/checkbox/checkbox.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {CheckboxComponent} from './checkbox.component';

@Component({
  template: `<fb-checkbox [formControl]="ctrl"></fb-checkbox>`,
  imports: [CheckboxComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl(false);
}

describe('CheckboxComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render unchecked by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it('should toggle when clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    input.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
  });

  it('should reflect formControl value', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(input.checked).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Checkbox component**

Create `frontend/src/app/shared/components/checkbox/checkbox.component.html`:

```html
<label class="inline-flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    class="h-4 w-4 rounded border border-input accent-accent focus:ring-2 focus:ring-ring cursor-pointer"
    [checked]="checked()"
    [disabled]="isDisabled()"
    (change)="onToggle($event)"
  />
  <ng-content />
</label>
```

Create `frontend/src/app/shared/components/checkbox/checkbox.component.ts`:

```typescript
import {Component, forwardRef, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'fb-checkbox',
  templateUrl: './checkbox.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxComponent),
    multi: true,
  }],
})
export class CheckboxComponent implements ControlValueAccessor {
  checked = signal(false);
  isDisabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked.set(checked);
    this.onChange(checked);
    this.onTouched();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/checkbox/
git commit -m "feat(design-system): add Checkbox component with ControlValueAccessor"
```

---

### Task 12: Radio Group Component

**Files:**
- Create: `frontend/src/app/shared/components/radio-group/radio-group.component.ts`
- Create: `frontend/src/app/shared/components/radio-group/radio-group.component.html`
- Create: `frontend/src/app/shared/components/radio-group/radio-group.component.spec.ts`

Single selection from options. Parent `RadioGroup` + child `RadioGroupItem`. Implements `ControlValueAccessor` on the group. Used in ScorerPredictionInput and Create League for rule selection.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/radio-group/radio-group.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {RadioGroupComponent, RadioGroupItemComponent} from './radio-group.component';

@Component({
  template: `
    <fb-radio-group [formControl]="ctrl">
      <fb-radio-group-item value="a">Option A</fb-radio-group-item>
      <fb-radio-group-item value="b">Option B</fb-radio-group-item>
      <fb-radio-group-item value="c">Option C</fb-radio-group-item>
    </fb-radio-group>
  `,
  imports: [RadioGroupComponent, RadioGroupItemComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('a');
}

describe('RadioGroupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render all radio items', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('fb-radio-group-item');
    expect(items.length).toBe(3);
  });

  it('should select initial value from formControl', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
  });

  it('should update formControl when item is clicked', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
    inputs[1].click();
    expect(fixture.componentInstance.ctrl.value).toBe('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement RadioGroup component**

Create `frontend/src/app/shared/components/radio-group/radio-group.component.html`:

```html
<div class="flex flex-col gap-2" role="radiogroup">
  <ng-content />
</div>
```

Create `frontend/src/app/shared/components/radio-group/radio-group.component.ts`:

```typescript
import {Component, computed, forwardRef, inject, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

const RADIO_GROUP_CONTEXT = Symbol('RadioGroupContext');

export class RadioGroupContext {
  selectedValue = signal<string>('');
  private onChange: (value: string) => void = () => {};

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  select(value: string): void {
    this.selectedValue.set(value);
    this.onChange(value);
  }
}

@Component({
  selector: 'fb-radio-group',
  templateUrl: './radio-group.component.html',
  providers: [
    {provide: RADIO_GROUP_CONTEXT, useFactory: () => new RadioGroupContext()},
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true},
  ],
})
export class RadioGroupComponent implements ControlValueAccessor {
  private context = inject(RADIO_GROUP_CONTEXT);
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.context.selectedValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.context.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

@Component({
  selector: 'fb-radio-group-item',
  host: {class: 'block'},
  template: `
    <label class="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        class="h-4 w-4 accent-accent focus:ring-2 focus:ring-ring cursor-pointer"
        [value]="value()"
        [checked]="isSelected()"
        (change)="onSelect()"
      />
      <ng-content />
    </label>
  `,
})
export class RadioGroupItemComponent {
  private context = inject(RADIO_GROUP_CONTEXT);
  value = input.required<string>();
  isSelected = computed(() => this.context.selectedValue() === this.value());

  onSelect(): void {
    this.context.select(this.value());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/radio-group/
git commit -m "feat(design-system): add RadioGroup component with ControlValueAccessor"
```

---

### Task 13: Select Component

**Files:**
- Create: `frontend/src/app/shared/components/select/select.component.ts`
- Create: `frontend/src/app/shared/components/select/select.component.html`
- Create: `frontend/src/app/shared/components/select/select.component.spec.ts`

Dropdown selection. Trigger shows selected value with chevron, dropdown panel with scroll. Implements `ControlValueAccessor`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/select/select.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SelectComponent, SelectItemComponent} from './select.component';

@Component({
  template: `
    <fb-select [formControl]="ctrl" placeholder="Choose...">
      <fb-select-item value="a">Alpha</fb-select-item>
      <fb-select-item value="b">Beta</fb-select-item>
      <fb-select-item value="c">Gamma</fb-select-item>
    </fb-select>
  `,
  imports: [SelectComponent, SelectItemComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('');
}

describe('SelectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should show placeholder when no value selected', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    expect(trigger.textContent).toContain('Choose...');
  });

  it('should open dropdown on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const dropdown = fixture.nativeElement.querySelector('[data-content]') as HTMLElement;
    expect(dropdown).toBeTruthy();
    expect(dropdown.classList.contains('hidden')).toBe(false);
  });

  it('should select item and close dropdown', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-trigger]') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('fb-select-item') as NodeListOf<HTMLElement>;
    items[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe('b');
    expect(trigger.textContent).toContain('Beta');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Select component**

Create `frontend/src/app/shared/components/select/select.component.html`:

```html
<div class="relative">
  <button
    type="button"
    data-trigger
    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
    (click)="toggleOpen()"
  >
    <span [class.text-muted-foreground]="!selectedLabel()">
      {{ selectedLabel() || placeholder() }}
    </span>
    <svg class="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div
    data-content
    class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto"
    [class.hidden]="!isOpen()"
  >
    <ng-content />
  </div>
</div>
```

Create `frontend/src/app/shared/components/select/select.component.ts`:

```typescript
import {Component, computed, forwardRef, inject, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

const SELECT_CONTEXT = Symbol('SelectContext');

export class SelectContext {
  selectedValue = signal('');
  selectedLabel = signal('');
  isOpen = signal(false);
  private onChange: (value: string) => void = () => {};

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  select(value: string, label: string): void {
    this.selectedValue.set(value);
    this.selectedLabel.set(label);
    this.isOpen.set(false);
    this.onChange(value);
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }
}

@Component({
  selector: 'fb-select',
  templateUrl: './select.component.html',
  providers: [
    {provide: SELECT_CONTEXT, useFactory: () => new SelectContext()},
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true},
  ],
})
export class SelectComponent implements ControlValueAccessor {
  private context = inject(SELECT_CONTEXT);
  placeholder = input('');

  selectedLabel = this.context.selectedLabel;
  isOpen = this.context.isOpen;

  toggleOpen(): void {
    this.context.toggleOpen();
  }

  writeValue(value: string): void {
    this.context.selectedValue.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.context.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {}
}

@Component({
  selector: 'fb-select-item',
  host: {
    class: 'block px-3 py-2 text-sm cursor-pointer hover:bg-accent/10 transition-colors',
    '(click)': 'onSelect()',
  },
  template: '<ng-content />',
})
export class SelectItemComponent {
  private context = inject(SELECT_CONTEXT);
  value = input.required<string>();
  label = signal('');

  ngAfterViewInit(): void {
    // Capture the projected text content as the label
    const el = document.querySelector(`fb-select-item[ng-reflect-value="${this.value()}"]`);
    if (el) {
      this.label.set(el.textContent?.trim() ?? this.value());
    }
  }

  onSelect(): void {
    this.context.select(this.value(), this.label() || this.value());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/select/
git commit -m "feat(design-system): add Select dropdown component with ControlValueAccessor"
```

---

### Task 14: Switch Component

**Files:**
- Create: `frontend/src/app/shared/components/switch/switch.component.ts`
- Create: `frontend/src/app/shared/components/switch/switch.component.html`
- Create: `frontend/src/app/shared/components/switch/switch.component.spec.ts`

On/off toggle. Pill-shaped track with circular thumb. Used in cookie settings dialog. Implements `ControlValueAccessor`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/switch/switch.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SwitchComponent} from './switch.component';

@Component({
  template: `<fb-switch [formControl]="ctrl"></fb-switch>`,
  imports: [SwitchComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl(false);
}

describe('SwitchComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render off by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
    expect(toggle.getAttribute('data-state')).toBe('unchecked');
  });

  it('should toggle on click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
    toggle.click();
    expect(fixture.componentInstance.ctrl.value).toBe(true);
  });

  it('should reflect formControl value', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue(true);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('[data-switch]') as HTMLElement;
    expect(toggle.getAttribute('data-state')).toBe('checked');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Switch component**

Create `frontend/src/app/shared/components/switch/switch.component.html`:

```html
<button
  type="button"
  role="switch"
  data-switch
  class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  [class.bg-accent]="checked()"
  [class.bg-input]="!checked()"
  [attr.data-state]="checked() ? 'checked' : 'unchecked'"
  [attr.aria-checked]="checked()"
  [disabled]="isDisabled()"
  (click)="toggle()"
>
  <span
    class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform"
    [class.translate-x-5]="checked()"
    [class.translate-x-0]="!checked()"
  ></span>
</button>
```

Create `frontend/src/app/shared/components/switch/switch.component.ts`:

```typescript
import {Component, forwardRef, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'fb-switch',
  templateUrl: './switch.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SwitchComponent),
    multi: true,
  }],
})
export class SwitchComponent implements ControlValueAccessor {
  checked = signal(false);
  isDisabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggle(): void {
    if (this.isDisabled()) return;
    const newValue = !this.checked();
    this.checked.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/switch/
git commit -m "feat(design-system): add Switch toggle component"
```

---

### Task 15: Slider Component

**Files:**
- Create: `frontend/src/app/shared/components/slider/slider.component.ts`
- Create: `frontend/src/app/shared/components/slider/slider.component.html`
- Create: `frontend/src/app/shared/components/slider/slider.component.spec.ts`

Range value selection. Track with accent-colored fill and draggable thumb. Implements `ControlValueAccessor`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/slider/slider.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {SliderComponent} from './slider.component';

@Component({
  template: `<fb-slider [formControl]="ctrl" [min]="0" [max]="100"></fb-slider>`,
  imports: [SliderComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl(50);
}

describe('SliderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render a range input', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('should reflect formControl value', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe('50');
  });

  it('should update formControl on input', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.ctrl.value).toBe(75);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Slider component**

Create `frontend/src/app/shared/components/slider/slider.component.html`:

```html
<input
  type="range"
  class="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary accent-accent focus:outline-none"
  [min]="min()"
  [max]="max()"
  [step]="step()"
  [value]="value()"
  [disabled]="isDisabled()"
  (input)="onInput($event)"
  (blur)="onTouched()"
/>
```

Create `frontend/src/app/shared/components/slider/slider.component.ts`:

```typescript
import {Component, forwardRef, input, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'fb-slider',
  templateUrl: './slider.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SliderComponent),
    multi: true,
  }],
})
export class SliderComponent implements ControlValueAccessor {
  min = input(0);
  max = input(100);
  step = input(1);
  value = signal(0);
  isDisabled = signal(false);

  private onChange: (value: number) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: number): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.value.set(val);
    this.onChange(val);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/slider/
git commit -m "feat(design-system): add Slider range component"
```

---

### Task 16: Toggle & Toggle Group Components

**Files:**
- Create: `frontend/src/app/shared/components/toggle/toggle.component.ts`
- Create: `frontend/src/app/shared/components/toggle/toggle.component.html`
- Create: `frontend/src/app/shared/components/toggle/toggle.component.spec.ts`

Pressable on/off button with `default` and `outline` variants. ToggleGroup manages single or multiple selection.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/toggle/toggle.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ToggleComponent, ToggleGroupComponent, ToggleGroupItemComponent} from './toggle.component';

@Component({
  template: `<fb-toggle [(pressed)]="isPressed">Bold</fb-toggle>`,
  imports: [ToggleComponent],
})
class SingleToggleHost {
  isPressed = false;
}

@Component({
  template: `
    <fb-toggle-group type="single" [(value)]="selected">
      <fb-toggle-group-item value="a">A</fb-toggle-group-item>
      <fb-toggle-group-item value="b">B</fb-toggle-group-item>
    </fb-toggle-group>
  `,
  imports: [ToggleGroupComponent, ToggleGroupItemComponent],
})
class GroupToggleHost {
  selected = 'a';
}

describe('ToggleComponent', () => {
  it('should toggle pressed state on click', async () => {
    await TestBed.configureTestingModule({imports: [SingleToggleHost]}).compileComponents();
    const fixture = TestBed.createComponent(SingleToggleHost);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isPressed).toBe(true);
    expect(btn.getAttribute('data-state')).toBe('on');
  });
});

describe('ToggleGroupComponent', () => {
  it('should select item on click', async () => {
    await TestBed.configureTestingModule({imports: [GroupToggleHost]}).compileComponents();
    const fixture = TestBed.createComponent(GroupToggleHost);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>;
    items[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected).toBe('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Toggle components**

Create `frontend/src/app/shared/components/toggle/toggle.component.html`:

```html
<button
  type="button"
  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 cursor-pointer"
  [class.bg-accent]="pressed()"
  [class.text-accent-foreground]="pressed()"
  [class.hover:bg-muted]="!pressed()"
  [attr.data-state]="pressed() ? 'on' : 'off'"
  (click)="onToggle()"
>
  <ng-content />
</button>
```

Create `frontend/src/app/shared/components/toggle/toggle.component.ts`:

```typescript
import {Component, computed, inject, input, model, signal} from '@angular/core';

const TOGGLE_GROUP_CONTEXT = Symbol('ToggleGroupContext');

export class ToggleGroupContext {
  type = signal<'single' | 'multiple'>('single');
  selectedValues = signal<string[]>([]);

  private onChange: (value: string | string[]) => void = () => {};

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }

  toggle(value: string): void {
    if (this.type() === 'single') {
      this.selectedValues.set([value]);
      this.onChange(value);
    } else {
      this.selectedValues.update(vals =>
        vals.includes(value) ? vals.filter(v => v !== value) : [...vals, value]
      );
      this.onChange(this.selectedValues());
    }
  }

  isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }
}

@Component({
  selector: 'fb-toggle',
  templateUrl: './toggle.component.html',
})
export class ToggleComponent {
  pressed = model(false);

  onToggle(): void {
    this.pressed.set(!this.pressed());
  }
}

@Component({
  selector: 'fb-toggle-group',
  host: {class: 'inline-flex items-center gap-1'},
  template: '<ng-content />',
  providers: [{provide: TOGGLE_GROUP_CONTEXT, useFactory: () => new ToggleGroupContext()}],
})
export class ToggleGroupComponent {
  private context = inject(TOGGLE_GROUP_CONTEXT);
  type = input<'single' | 'multiple'>('single');
  value = model<string | string[]>('');

  ngOnInit(): void {
    this.context.type.set(this.type());
    const v = this.value();
    this.context.selectedValues.set(Array.isArray(v) ? v : v ? [v] : []);
    this.context.registerOnChange((newVal) => this.value.set(newVal));
  }
}

@Component({
  selector: 'fb-toggle-group-item',
  template: `
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 cursor-pointer"
      [class.bg-accent]="isSelected()"
      [class.text-accent-foreground]="isSelected()"
      [class.hover:bg-muted]="!isSelected()"
      [attr.data-state]="isSelected() ? 'on' : 'off'"
      (click)="onToggle()"
    >
      <ng-content />
    </button>
  `,
})
export class ToggleGroupItemComponent {
  private context = inject(TOGGLE_GROUP_CONTEXT);
  value = input.required<string>();

  isSelected(): boolean {
    return this.context.isSelected(this.value());
  }

  onToggle(): void {
    this.context.toggle(this.value());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/toggle/
git commit -m "feat(design-system): add Toggle and ToggleGroup components"
```

---

### Task 17: FormGroup Component

**Files:**
- Create: `frontend/src/app/shared/components/form-group/form-group.component.ts`
- Create: `frontend/src/app/shared/components/form-group/form-group.component.html`
- Create: `frontend/src/app/shared/components/form-group/form-group.component.spec.ts`

Unified wrapper for a form field — handles label, control, description, spacing, and validation error display.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/form-group/form-group.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, Validators, ReactiveFormsModule} from '@angular/forms';
import {FormGroupComponent} from './form-group.component';

@Component({
  template: `
    <fb-form-group label="Email" description="We'll never share your email." [control]="ctrl">
      <input [formControl]="ctrl" />
    </fb-form-group>
  `,
  imports: [FormGroupComponent, ReactiveFormsModule],
})
class TestHostComponent {
  ctrl = new FormControl('', Validators.required);
}

describe('FormGroupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render label', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label') as HTMLElement;
    expect(label.textContent).toContain('Email');
  });

  it('should render description', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('[data-description]') as HTMLElement;
    expect(desc.textContent).toContain("We'll never share your email.");
  });

  it('should show error when control is touched and invalid', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('[data-error]') as HTMLElement;
    expect(error).toBeTruthy();
  });

  it('should not show error when control is valid', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue('test@example.com');
    fixture.componentInstance.ctrl.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('[data-error]') as HTMLElement;
    expect(error).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement FormGroup component**

Create `frontend/src/app/shared/components/form-group/form-group.component.html`:

```html
<div class="space-y-2 mb-4">
  @if (label()) {
    <label class="text-sm font-medium">{{ label() }}</label>
  }
  <ng-content />
  @if (description()) {
    <p data-description class="text-muted-foreground text-sm">{{ description() }}</p>
  }
  @if (errorMessage()) {
    <p data-error class="text-destructive text-sm">{{ errorMessage() }}</p>
  }
</div>
```

Create `frontend/src/app/shared/components/form-group/form-group.component.ts`:

```typescript
import {Component, computed, input, Signal} from '@angular/core';
import {FormControl} from '@angular/forms';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';

const ERROR_MESSAGES: Record<string, (params?: any) => string> = {
  required: () => 'This field is required',
  email: () => 'Please enter a valid email',
  minlength: (p) => `Minimum ${p.requiredLength} characters`,
  maxlength: (p) => `Maximum ${p.requiredLength} characters`,
  pattern: () => 'Invalid format',
};

@Component({
  selector: 'fb-form-group',
  templateUrl: './form-group.component.html',
})
export class FormGroupComponent {
  label = input('');
  description = input('');
  control = input<FormControl | null>(null);

  private status: Signal<string> = toSignal(
    toObservable(this.control).pipe(
      switchMap(c => c ? c.statusChanges : [])
    ),
    {initialValue: 'VALID'}
  );

  errorMessage = computed(() => {
    this.status();
    const ctrl = this.control();
    if (!ctrl || !ctrl.errors || !ctrl.touched) return null;
    const firstKey = Object.keys(ctrl.errors)[0];
    const messageFn = ERROR_MESSAGES[firstKey];
    return messageFn ? messageFn(ctrl.errors[firstKey]) : 'Invalid value';
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/form-group/
git commit -m "feat(design-system): add FormGroup component with auto validation"
```

---

### Task 18: Skeleton Component

**Files:**
- Create: `frontend/src/app/shared/components/skeleton/skeleton.component.ts`
- Create: `frontend/src/app/shared/components/skeleton/skeleton.component.spec.ts`

Loading placeholder with animated pulse.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/skeleton/skeleton.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {SkeletonComponent} from './skeleton.component';

describe('SkeletonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();
  });

  it('should render with animate-pulse class', () => {
    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-skeleton]') as HTMLElement;
    expect(el.classList.contains('animate-pulse')).toBe(true);
  });

  it('should accept custom class for sizing', () => {
    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('class', 'h-4 w-32');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-skeleton]') as HTMLElement;
    expect(el.className).toContain('h-4');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Skeleton component**

Create `frontend/src/app/shared/components/skeleton/skeleton.component.ts`:

```typescript
import {Component, input} from '@angular/core';

@Component({
  selector: 'fb-skeleton',
  template: `<div data-skeleton class="animate-pulse rounded-md bg-muted" [class]="class()"></div>`,
})
export class SkeletonComponent {
  class = input('h-4 w-full');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/skeleton/
git commit -m "feat(design-system): add Skeleton loading component"
```

---

### Task 19: Alert Component

**Files:**
- Create: `frontend/src/app/shared/components/alert/alert.component.ts`
- Create: `frontend/src/app/shared/components/alert/alert.component.spec.ts`

Informational messages with `default` and `destructive` variants. Composed of AlertTitle and AlertDescription via content projection.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/alert/alert.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {AlertComponent, AlertTitleComponent, AlertDescriptionComponent} from './alert.component';

@Component({
  template: `
    <fb-alert variant="destructive">
      <fb-alert-title>Error</fb-alert-title>
      <fb-alert-description>Something went wrong.</fb-alert-description>
    </fb-alert>
  `,
  imports: [AlertComponent, AlertTitleComponent, AlertDescriptionComponent],
})
class TestHostComponent {}

describe('AlertComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render title and description', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fb-alert-title')?.textContent).toContain('Error');
    expect(el.querySelector('fb-alert-description')?.textContent).toContain('Something went wrong.');
  });

  it('should apply destructive variant styling', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('fb-alert') as HTMLElement;
    expect(alert.classList.contains('border-destructive')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Alert component**

Create `frontend/src/app/shared/components/alert/alert.component.ts`:

```typescript
import {Component, input} from '@angular/core';

@Component({
  selector: 'fb-alert',
  host: {
    class: 'relative w-full rounded-lg border p-4 block',
    '[class.border-border]': 'variant() === "default"',
    '[class.border-destructive]': 'variant() === "destructive"',
    '[class.text-destructive]': 'variant() === "destructive"',
  },
  template: '<ng-content />',
})
export class AlertComponent {
  variant = input<'default' | 'destructive'>('default');
}

@Component({
  selector: 'fb-alert-title',
  host: {class: 'mb-1 font-medium leading-none tracking-tight block'},
  template: '<ng-content />',
})
export class AlertTitleComponent {}

@Component({
  selector: 'fb-alert-description',
  host: {class: 'text-sm [&_p]:leading-relaxed block'},
  template: '<ng-content />',
})
export class AlertDescriptionComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/alert/
git commit -m "feat(design-system): add Alert component with variants"
```

---

### Task 20: Accordion Component

**Files:**
- Create: `frontend/src/app/shared/components/accordion/accordion.component.ts`
- Create: `frontend/src/app/shared/components/accordion/accordion.component.html`
- Create: `frontend/src/app/shared/components/accordion/accordion.component.spec.ts`

Collapsible content sections. Used in Rules page for FAQs. Trigger text left-aligned, chevron rotates.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/accordion/accordion.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {AccordionComponent, AccordionItemComponent, AccordionTriggerComponent, AccordionContentComponent} from './accordion.component';

@Component({
  template: `
    <fb-accordion type="single">
      <fb-accordion-item value="item1">
        <fb-accordion-trigger>Section 1</fb-accordion-trigger>
        <fb-accordion-content>Content 1</fb-accordion-content>
      </fb-accordion-item>
      <fb-accordion-item value="item2">
        <fb-accordion-trigger>Section 2</fb-accordion-trigger>
        <fb-accordion-content>Content 2</fb-accordion-content>
      </fb-accordion-item>
    </fb-accordion>
  `,
  imports: [AccordionComponent, AccordionItemComponent, AccordionTriggerComponent, AccordionContentComponent],
})
class TestHostComponent {}

describe('AccordionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render all items collapsed by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const contents = fixture.nativeElement.querySelectorAll('fb-accordion-content') as NodeListOf<HTMLElement>;
    expect(contents[0].classList.contains('hidden')).toBe(true);
    expect(contents[1].classList.contains('hidden')).toBe(true);
  });

  it('should expand item on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('fb-accordion-trigger') as NodeListOf<HTMLElement>;
    triggers[0].click();
    fixture.detectChanges();
    const contents = fixture.nativeElement.querySelectorAll('fb-accordion-content') as NodeListOf<HTMLElement>;
    expect(contents[0].classList.contains('hidden')).toBe(false);
    expect(contents[1].classList.contains('hidden')).toBe(true);
  });

  it('should collapse previous item in single mode', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('fb-accordion-trigger') as NodeListOf<HTMLElement>;
    triggers[0].click();
    fixture.detectChanges();
    triggers[1].click();
    fixture.detectChanges();
    const contents = fixture.nativeElement.querySelectorAll('fb-accordion-content') as NodeListOf<HTMLElement>;
    expect(contents[0].classList.contains('hidden')).toBe(true);
    expect(contents[1].classList.contains('hidden')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Accordion component**

Create `frontend/src/app/shared/components/accordion/accordion.component.html`:

```html
<div class="divide-y divide-border">
  <ng-content />
</div>
```

Create `frontend/src/app/shared/components/accordion/accordion.component.ts`:

```typescript
import {Component, computed, inject, input, signal} from '@angular/core';

const ACCORDION_CONTEXT = Symbol('AccordionContext');

export class AccordionContext {
  type = signal<'single' | 'multiple'>('single');
  openItems = signal<Set<string>>(new Set());

  toggle(value: string): void {
    this.openItems.update(items => {
      const next = new Set(items);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (this.type() === 'single') {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  }

  isOpen(value: string): boolean {
    return this.openItems().has(value);
  }
}

@Component({
  selector: 'fb-accordion',
  host: {class: 'block'},
  templateUrl: './accordion.component.html',
  providers: [{provide: ACCORDION_CONTEXT, useFactory: () => new AccordionContext()}],
})
export class AccordionComponent {
  private context = inject(ACCORDION_CONTEXT);
  type = input<'single' | 'multiple'>('single');

  ngOnInit(): void {
    this.context.type.set(this.type());
  }
}

@Component({
  selector: 'fb-accordion-item',
  host: {class: 'block py-4'},
  template: '<ng-content />',
})
export class AccordionItemComponent {
  value = input.required<string>();
}

@Component({
  selector: 'fb-accordion-trigger',
  host: {
    class: 'flex w-full items-center justify-between text-sm font-medium cursor-pointer transition-all hover:underline',
    '(click)': 'onClick()',
  },
  template: `
    <ng-content />
    <svg
      class="h-4 w-4 shrink-0 transition-transform duration-200"
      [class.rotate-180]="isOpen()"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    ><path d="m6 9 6 6 6-6"/></svg>
  `,
})
export class AccordionTriggerComponent {
  private context = inject(ACCORDION_CONTEXT);
  private item = inject(AccordionItemComponent);

  isOpen(): boolean {
    return this.context.isOpen(this.item.value());
  }

  onClick(): void {
    this.context.toggle(this.item.value());
  }
}

@Component({
  selector: 'fb-accordion-content',
  host: {
    class: 'text-sm pt-2 block',
    '[class.hidden]': '!isOpen()',
  },
  template: '<ng-content />',
})
export class AccordionContentComponent {
  private context = inject(ACCORDION_CONTEXT);
  private item = inject(AccordionItemComponent);

  isOpen(): boolean {
    return this.context.isOpen(this.item.value());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/accordion/
git commit -m "feat(design-system): add Accordion component with single/multiple mode"
```

---

### Task 21: Table Component

**Files:**
- Create: `frontend/src/app/shared/components/table/table.component.ts`
- Create: `frontend/src/app/shared/components/table/table.component.spec.ts`

Styled data table. Used in Rules page for points system. Sub-components compose native table elements.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/table/table.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent} from './table.component';

@Component({
  template: `
    <fb-table>
      <fb-table-header>
        <fb-table-row>
          <fb-table-head>Name</fb-table-head>
          <fb-table-head>Points</fb-table-head>
        </fb-table-row>
      </fb-table-header>
      <fb-table-body>
        <fb-table-row>
          <fb-table-cell>Alice</fb-table-cell>
          <fb-table-cell>120</fb-table-cell>
        </fb-table-row>
      </fb-table-body>
    </fb-table>
  `,
  imports: [TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent],
})
class TestHostComponent {}

describe('TableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render table with header and body', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('table')).toBeTruthy();
    expect(el.querySelector('thead')).toBeTruthy();
    expect(el.querySelector('tbody')).toBeTruthy();
  });

  it('should render cell content', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('120');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Table component**

Create `frontend/src/app/shared/components/table/table.component.ts`:

```typescript
import {Component} from '@angular/core';

@Component({
  selector: 'fb-table',
  template: '<table class="w-full caption-bottom text-sm"><ng-content /></table>',
})
export class TableComponent {}

@Component({
  selector: 'fb-table-header',
  template: '<thead class="[&_tr]:border-b"><ng-content /></thead>',
})
export class TableHeaderComponent {}

@Component({
  selector: 'fb-table-body',
  template: '<tbody class="[&_tr:last-child]:border-0"><ng-content /></tbody>',
})
export class TableBodyComponent {}

@Component({
  selector: 'fb-table-row',
  template: '<tr class="border-b border-border transition-colors hover:bg-muted/50"><ng-content /></tr>',
})
export class TableRowComponent {}

@Component({
  selector: 'fb-table-head',
  template: '<th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><ng-content /></th>',
})
export class TableHeadComponent {}

@Component({
  selector: 'fb-table-cell',
  template: '<td class="p-4 align-middle"><ng-content /></td>',
})
export class TableCellComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/table/
git commit -m "feat(design-system): add Table component with sub-components"
```

---

### Task 22: Tooltip Directive

**Files:**
- Create: `frontend/src/app/shared/directives/tooltip.directive.ts`
- Create: `frontend/src/app/shared/directives/tooltip.directive.spec.ts`

Simple text tooltip on hover. Applied as a directive to any element.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/directives/tooltip.directive.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {TooltipDirective} from './tooltip.directive';

@Component({
  template: `<button fbTooltip="Help text">Hover me</button>`,
  imports: [TooltipDirective],
})
class TestHostComponent {}

describe('TooltipDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should not show tooltip initially', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('[data-tooltip]');
    expect(tooltip).toBeNull();
  });

  it('should show tooltip on mouseenter', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    button.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('[data-tooltip]') as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('Help text');
  });

  it('should hide tooltip on mouseleave', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    button.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    button.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('[data-tooltip]');
    expect(tooltip).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Tooltip directive**

Create `frontend/src/app/shared/directives/tooltip.directive.ts`:

```typescript
import {Directive, ElementRef, HostListener, inject, input, Renderer2} from '@angular/core';

@Directive({
  selector: '[fbTooltip]',
})
export class TooltipDirective {
  fbTooltip = input.required<string>();
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltipEl: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  private show(): void {
    if (this.tooltipEl) return;
    this.tooltipEl = this.renderer.createElement('div');
    this.renderer.setAttribute(this.tooltipEl, 'data-tooltip', '');
    this.renderer.addClass(this.tooltipEl, 'absolute');
    this.renderer.addClass(this.tooltipEl, 'z-50');
    this.renderer.addClass(this.tooltipEl, 'rounded-md');
    this.renderer.addClass(this.tooltipEl, 'bg-primary');
    this.renderer.addClass(this.tooltipEl, 'text-primary-foreground');
    this.renderer.addClass(this.tooltipEl, 'px-3');
    this.renderer.addClass(this.tooltipEl, 'py-1.5');
    this.renderer.addClass(this.tooltipEl, 'text-xs');
    this.renderer.addClass(this.tooltipEl, 'shadow-md');
    const text = this.renderer.createText(this.fbTooltip());
    this.renderer.appendChild(this.tooltipEl, text);

    const hostEl = this.el.nativeElement as HTMLElement;
    this.renderer.setStyle(hostEl, 'position', 'relative');
    this.renderer.setStyle(this.tooltipEl, 'bottom', '100%');
    this.renderer.setStyle(this.tooltipEl, 'left', '50%');
    this.renderer.setStyle(this.tooltipEl, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(this.tooltipEl, 'margin-bottom', '4px');
    this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
    this.renderer.appendChild(hostEl, this.tooltipEl);
  }

  private hide(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(this.el.nativeElement, this.tooltipEl);
      this.tooltipEl = null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/directives/
git commit -m "feat(design-system): add Tooltip directive"
```

---

### Task 23: Popover Component

**Files:**
- Create: `frontend/src/app/shared/components/popover/popover.component.ts`
- Create: `frontend/src/app/shared/components/popover/popover.component.html`
- Create: `frontend/src/app/shared/components/popover/popover.component.spec.ts`

Floating content anchored to trigger. Click to open/close. Uses `absolute`/`relative` positioning.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/popover/popover.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {PopoverComponent, PopoverTriggerComponent, PopoverContentComponent} from './popover.component';

@Component({
  template: `
    <fb-popover>
      <fb-popover-trigger>
        <button>Open</button>
      </fb-popover-trigger>
      <fb-popover-content>Popover content</fb-popover-content>
    </fb-popover>
  `,
  imports: [PopoverComponent, PopoverTriggerComponent, PopoverContentComponent],
})
class TestHostComponent {}

describe('PopoverComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should hide content by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(true);
  });

  it('should show content on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('fb-popover-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(false);
  });

  it('should hide content on second trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('fb-popover-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-popover-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Popover component**

Create `frontend/src/app/shared/components/popover/popover.component.html`:

```html
<div class="relative inline-block">
  <ng-content />
</div>
```

Create `frontend/src/app/shared/components/popover/popover.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const POPOVER_CONTEXT = Symbol('PopoverContext');

export class PopoverContext {
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'fb-popover',
  templateUrl: './popover.component.html',
  providers: [{provide: POPOVER_CONTEXT, useFactory: () => new PopoverContext()}],
})
export class PopoverComponent {}

@Component({
  selector: 'fb-popover-trigger',
  host: {
    class: 'inline-block cursor-pointer',
    '(click)': 'onClick()',
  },
  template: '<ng-content />',
})
export class PopoverTriggerComponent {
  private context = inject(POPOVER_CONTEXT);

  onClick(): void {
    this.context.toggle();
  }
}

@Component({
  selector: 'fb-popover-content',
  host: {
    class: 'absolute z-50 mt-2 w-72 rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-md',
    '[class.hidden]': '!context.isOpen()',
  },
  template: '<ng-content />',
})
export class PopoverContentComponent {
  context = inject(POPOVER_CONTEXT);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/popover/
git commit -m "feat(design-system): add Popover component"
```

---

### Task 24: Dropdown Menu Component

**Files:**
- Create: `frontend/src/app/shared/components/dropdown-menu/dropdown-menu.component.ts`
- Create: `frontend/src/app/shared/components/dropdown-menu/dropdown-menu.component.spec.ts`

Click-triggered menu. Used in sidebar for user actions. Composed of trigger, content, items, and separator sub-components.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/dropdown-menu/dropdown-menu.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {DropdownMenuComponent, DropdownMenuTriggerComponent, DropdownMenuContentComponent, DropdownMenuItemComponent, DropdownMenuSeparatorComponent} from './dropdown-menu.component';

@Component({
  template: `
    <fb-dropdown-menu>
      <fb-dropdown-menu-trigger>
        <button>Menu</button>
      </fb-dropdown-menu-trigger>
      <fb-dropdown-menu-content>
        <fb-dropdown-menu-item>Profile</fb-dropdown-menu-item>
        <fb-dropdown-menu-separator></fb-dropdown-menu-separator>
        <fb-dropdown-menu-item>Logout</fb-dropdown-menu-item>
      </fb-dropdown-menu-content>
    </fb-dropdown-menu>
  `,
  imports: [DropdownMenuComponent, DropdownMenuTriggerComponent, DropdownMenuContentComponent, DropdownMenuItemComponent, DropdownMenuSeparatorComponent],
})
class TestHostComponent {}

describe('DropdownMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should hide menu by default', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-dropdown-menu-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(true);
  });

  it('should show menu on trigger click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('fb-dropdown-menu-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('fb-dropdown-menu-content') as HTMLElement;
    expect(content.classList.contains('hidden')).toBe(false);
  });

  it('should render menu items and separator', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('fb-dropdown-menu-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Profile');
    expect(el.textContent).toContain('Logout');
    expect(el.querySelector('fb-dropdown-menu-separator')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement DropdownMenu component**

Create `frontend/src/app/shared/components/dropdown-menu/dropdown-menu.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const DROPDOWN_CONTEXT = Symbol('DropdownContext');

export class DropdownContext {
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }
}

@Component({
  selector: 'fb-dropdown-menu',
  host: {class: 'relative inline-block'},
  template: '<ng-content />',
  providers: [{provide: DROPDOWN_CONTEXT, useFactory: () => new DropdownContext()}],
})
export class DropdownMenuComponent {}

@Component({
  selector: 'fb-dropdown-menu-trigger',
  host: {
    class: 'inline-block cursor-pointer',
    '(click)': 'context.toggle()',
  },
  template: '<ng-content />',
})
export class DropdownMenuTriggerComponent {
  context = inject(DROPDOWN_CONTEXT);
}

@Component({
  selector: 'fb-dropdown-menu-content',
  host: {
    class: 'absolute z-50 mt-2 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
    '[class.hidden]': '!context.isOpen()',
  },
  template: '<ng-content />',
})
export class DropdownMenuContentComponent {
  context = inject(DROPDOWN_CONTEXT);
}

@Component({
  selector: 'fb-dropdown-menu-item',
  host: {
    class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
    '(click)': 'context.close()',
  },
  template: '<ng-content />',
})
export class DropdownMenuItemComponent {
  context = inject(DROPDOWN_CONTEXT);
}

@Component({
  selector: 'fb-dropdown-menu-separator',
  host: {class: 'block -mx-1 my-1 h-px bg-border'},
  template: '',
})
export class DropdownMenuSeparatorComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/dropdown-menu/
git commit -m "feat(design-system): add DropdownMenu component"
```

---

### Task 25: Pagination Component

**Files:**
- Create: `frontend/src/app/shared/components/pagination/pagination.component.ts`
- Create: `frontend/src/app/shared/components/pagination/pagination.component.html`
- Create: `frontend/src/app/shared/components/pagination/pagination.component.spec.ts`

Page navigation controls with previous/next buttons and page numbers.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/pagination/pagination.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {PaginationComponent} from './pagination.component';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
  });

  it('should render page numbers', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1');
    expect(el.textContent).toContain('5');
  });

  it('should disable previous button on first page', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    const prev = fixture.nativeElement.querySelector('[data-prev]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('should emit pageChange on page click', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();
    let emittedPage = 0;
    fixture.componentInstance.pageChange.subscribe((p: number) => emittedPage = p);
    const next = fixture.nativeElement.querySelector('[data-next]') as HTMLButtonElement;
    next.click();
    expect(emittedPage).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Pagination component**

Create `frontend/src/app/shared/components/pagination/pagination.component.html`:

```html
<nav class="flex items-center justify-center gap-1">
  <button
    data-prev
    class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
    [disabled]="currentPage() <= 1"
    (click)="goToPage(currentPage() - 1)"
  >
    Previous
  </button>
  @for (page of pages(); track page) {
    <button
      class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 cursor-pointer transition-colors"
      [class.bg-accent]="page === currentPage()"
      [class.text-accent-foreground]="page === currentPage()"
      [class.hover:bg-muted]="page !== currentPage()"
      (click)="goToPage(page)"
    >
      {{ page }}
    </button>
  }
  <button
    data-next
    class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
    [disabled]="currentPage() >= totalPages()"
    (click)="goToPage(currentPage() + 1)"
  >
    Next
  </button>
</nav>
```

Create `frontend/src/app/shared/components/pagination/pagination.component.ts`:

```typescript
import {Component, computed, input, output} from '@angular/core';

@Component({
  selector: 'fb-pagination',
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/pagination/
git commit -m "feat(design-system): add Pagination component"
```

---

### Task 26: Collapsible Component

**Files:**

- Create: `frontend/src/app/shared/components/collapsible/collapsible.component.ts`
- Create: `frontend/src/app/shared/components/collapsible/collapsible.component.spec.ts`

Simple show/hide toggle. Lighter than Accordion — no context, no grouping. Just a trigger and content with open/close
state.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/collapsible/collapsible.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {CollapsibleComponent, CollapsibleTriggerComponent, CollapsibleContentComponent} from './collapsible.component';

@Component({
    template: `
    <fb-collapsible [(open)]="isOpen">
      <fb-collapsible-trigger>
        <button>Toggle</button>
      </fb-collapsible-trigger>
      <fb-collapsible-content>Hidden content</fb-collapsible-content>
    </fb-collapsible>
  `,
    imports: [CollapsibleComponent, CollapsibleTriggerComponent, CollapsibleContentComponent],
})
class TestHostComponent {
    isOpen = false;
}

describe('CollapsibleComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should hide content when closed', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-collapsible-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content when open', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.isOpen = true;
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-collapsible-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should toggle on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-collapsible-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.isOpen).toBe(true);
        const content = fixture.nativeElement.querySelector('fb-collapsible-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Collapsible component**

Create `frontend/src/app/shared/components/collapsible/collapsible.component.ts`:

```typescript
import {Component, inject, model} from '@angular/core';

const COLLAPSIBLE_CONTEXT = Symbol('CollapsibleContext');

@Component({
    selector: 'fb-collapsible',
    host: {class: 'block'},
    template: '<ng-content />',
    providers: [{provide: COLLAPSIBLE_CONTEXT, useExisting: CollapsibleComponent}],
})
export class CollapsibleComponent {
    open = model(false);

    toggle(): void {
        this.open.set(!this.open());
    }
}

@Component({
    selector: 'fb-collapsible-trigger',
    host: {
        class: 'block cursor-pointer',
        '(click)': 'collapsible.toggle()',
    },
    template: '<ng-content />',
})
export class CollapsibleTriggerComponent {
    collapsible = inject(COLLAPSIBLE_CONTEXT) as CollapsibleComponent;
}

@Component({
    selector: 'fb-collapsible-content',
    host: {
        class: 'block',
        '[class.hidden]': '!collapsible.open()',
    },
    template: '<ng-content />',
})
export class CollapsibleContentComponent {
    collapsible = inject(COLLAPSIBLE_CONTEXT) as CollapsibleComponent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/collapsible/
git commit -m "feat(design-system): add Collapsible component"
```

---

### Task 27: Scroll Area Component

**Files:**

- Create: `frontend/src/app/shared/components/scroll-area/scroll-area.component.ts`
- Create: `frontend/src/app/shared/components/scroll-area/scroll-area.component.spec.ts`

Custom scrollbar container. Thin styled scrollbar track via CSS.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/scroll-area/scroll-area.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {ScrollAreaComponent} from './scroll-area.component';

describe('ScrollAreaComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScrollAreaComponent],
        }).compileComponents();
    });

    it('should render with overflow auto', () => {
        const fixture = TestBed.createComponent(ScrollAreaComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        const container = el.querySelector('[data-scroll-area]') as HTMLElement;
        expect(container).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Scroll Area component**

Create `frontend/src/app/shared/components/scroll-area/scroll-area.component.ts`:

```typescript
import {Component, input} from '@angular/core';

@Component({
    selector: 'fb-scroll-area',
    host: {class: 'relative block'},
    styles: `
    .scroll-container {
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: hsl(var(--border)) transparent;
    }
    .scroll-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .scroll-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .scroll-container::-webkit-scrollbar-thumb {
      background-color: hsl(var(--border));
      border-radius: 9999px;
    }
  `,
    template: `<div data-scroll-area class="scroll-container h-full w-full"><ng-content /></div>`,
})
export class ScrollAreaComponent {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/scroll-area/
git commit -m "feat(design-system): add ScrollArea component with custom scrollbar"
```

---

### Task 28: Input OTP Component

**Files:**

- Create: `frontend/src/app/shared/components/input-otp/input-otp.component.ts`
- Create: `frontend/src/app/shared/components/input-otp/input-otp.component.html`
- Create: `frontend/src/app/shared/components/input-otp/input-otp.component.spec.ts`

Series of single-character input boxes for verification codes. Implements `ControlValueAccessor`. Auto-advances focus on
input.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/input-otp/input-otp.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {InputOtpComponent} from './input-otp.component';

@Component({
    template: `<fb-input-otp [formControl]="ctrl" [length]="6"></fb-input-otp>`,
    imports: [InputOtpComponent, ReactiveFormsModule],
})
class TestHostComponent {
    ctrl = new FormControl('');
}

describe('InputOtpComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render correct number of input boxes', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        expect(inputs.length).toBe(6);
    });

    it('should combine values into formControl', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        inputs[0].value = '1';
        inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = '2';
        inputs[1].dispatchEvent(new Event('input'));
        inputs[2].value = '3';
        inputs[2].dispatchEvent(new Event('input'));
        inputs[3].value = '4';
        inputs[3].dispatchEvent(new Event('input'));
        inputs[4].value = '5';
        inputs[4].dispatchEvent(new Event('input'));
        inputs[5].value = '6';
        inputs[5].dispatchEvent(new Event('input'));
        expect(fixture.componentInstance.ctrl.value).toBe('123456');
    });

    it('should emit complete when all boxes filled', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let completed = false;
        fixture.componentInstance.ctrl.valueChanges.subscribe(val => {
            if (val && val.length === 6) completed = true;
        });
        const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        for (let i = 0; i < 6; i++) {
            inputs[i].value = String(i + 1);
            inputs[i].dispatchEvent(new Event('input'));
        }
        expect(completed).toBe(true);
    });

    it('should populate boxes from formControl value', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.ctrl.setValue('ABC123');
        fixture.detectChanges();
        const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
        expect(inputs[0].value).toBe('A');
        expect(inputs[5].value).toBe('3');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Input OTP component**

Create `frontend/src/app/shared/components/input-otp/input-otp.component.html`:

```html

<div class="flex items-center gap-2">
    @for (i of slots(); track i) {
    <input
        #otpInput
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="h-10 w-10 rounded-md border border-input bg-background text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        [value]="values()[i]"
        [disabled]="isDisabled()"
        (input)="onInput(i, $event)"
        (keydown)="onKeydown(i, $event)"
        (paste)="onPaste($event)"
    />
    }
</div>
```

Create `frontend/src/app/shared/components/input-otp/input-otp.component.ts`:

```typescript
import {Component, ElementRef, forwardRef, input, signal, computed, viewChildren} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
    selector: 'fb-input-otp',
    templateUrl: './input-otp.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => InputOtpComponent),
        multi: true,
    }],
})
export class InputOtpComponent implements ControlValueAccessor {
    length = input(6);
    slots = computed(() => Array.from({length: this.length()}, (_, i) => i));
    values = signal<string[]>([]);
    isDisabled = signal(false);
    private otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

    private onChange: (value: string) => void = () => {
    };
    private onTouched: () => void = () => {
    };

    writeValue(value: string): void {
        const chars = (value ?? '').split('').slice(0, this.length());
        const padded = Array.from({length: this.length()}, (_, i) => chars[i] ?? '');
        this.values.set(padded);
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

    onInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        const char = input.value.slice(-1);
        this.values.update(v => {
            const next = [...v];
            next[index] = char;
            return next;
        });
        this.emitValue();
        if (char && index < this.length() - 1) {
            this.focusAt(index + 1);
        }
    }

    onKeydown(index: number, event: KeyboardEvent): void {
        if (event.key === 'Backspace' && !this.values()[index] && index > 0) {
            this.values.update(v => {
                const next = [...v];
                next[index - 1] = '';
                return next;
            });
            this.emitValue();
            this.focusAt(index - 1);
        }
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const pasted = event.clipboardData?.getData('text') ?? '';
        const chars = pasted.split('').slice(0, this.length());
        const padded = Array.from({length: this.length()}, (_, i) => chars[i] ?? this.values()[i] ?? '');
        this.values.set(padded);
        this.emitValue();
        const nextEmpty = padded.findIndex(c => !c);
        this.focusAt(nextEmpty >= 0 ? nextEmpty : this.length() - 1);
    }

    private focusAt(index: number): void {
        const inputs = this.otpInputs();
        if (inputs[index]) {
            inputs[index].nativeElement.focus();
        }
    }

    private emitValue(): void {
        const combined = this.values().join('');
        this.onChange(combined);
        this.onTouched();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/input-otp/
git commit -m "feat(design-system): add Input OTP component"
```

---

### Task 29: Alert Dialog Component

**Files:**

- Create: `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.ts`
- Create: `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.html`
- Create: `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.spec.ts`

Confirmation dialog for destructive actions. Uses native `<dialog>` like Dialog (Task 5) but adds explicit action/cancel
buttons. User must confirm or cancel — no implicit close on backdrop click.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.spec.ts`:

```typescript
import {Component, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    AlertDialogComponent,
    AlertDialogHeaderComponent,
    AlertDialogTitleComponent,
    AlertDialogDescriptionComponent,
    AlertDialogFooterComponent,
    AlertDialogActionComponent,
    AlertDialogCancelComponent
} from './alert-dialog.component';

@Component({
    template: `
    <fb-alert-dialog #dialog>
      <fb-alert-dialog-header>
        <fb-alert-dialog-title>Are you sure?</fb-alert-dialog-title>
        <fb-alert-dialog-description>This action cannot be undone.</fb-alert-dialog-description>
      </fb-alert-dialog-header>
      <fb-alert-dialog-footer>
        <fb-alert-dialog-cancel>Cancel</fb-alert-dialog-cancel>
        <fb-alert-dialog-action>Continue</fb-alert-dialog-action>
      </fb-alert-dialog-footer>
    </fb-alert-dialog>
  `,
    imports: [AlertDialogComponent, AlertDialogHeaderComponent, AlertDialogTitleComponent, AlertDialogDescriptionComponent, AlertDialogFooterComponent, AlertDialogActionComponent, AlertDialogCancelComponent],
})
class TestHostComponent {
    dialog = viewChild.required<AlertDialogComponent>('dialog');
}

describe('AlertDialogComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should be closed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        expect(dialog.open).toBe(false);
    });

    it('should open when open() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.dialog().open();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    });

    it('should close when cancel is clicked', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.dialog().open();
        const cancel = fixture.nativeElement.querySelector('fb-alert-dialog-cancel button') as HTMLElement;
        cancel.click();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should emit confirmed and close when action is clicked', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let confirmed = false;
        fixture.componentInstance.dialog().confirmed.subscribe(() => confirmed = true);
        fixture.componentInstance.dialog().open();
        const action = fixture.nativeElement.querySelector('fb-alert-dialog-action button') as HTMLElement;
        action.click();
        expect(confirmed).toBe(true);
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render title and description', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('fb-alert-dialog-title')?.textContent).toContain('Are you sure?');
        expect(el.querySelector('fb-alert-dialog-description')?.textContent).toContain('This action cannot be undone.');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Alert Dialog component**

Create `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.html`:

```html

<dialog
    #dialogEl
    class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-md backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    (cancel)="$event.preventDefault()"
>
    <div class="p-6">
        <ng-content/>
    </div>
</dialog>
```

Create `frontend/src/app/shared/components/alert-dialog/alert-dialog.component.ts`:

```typescript
import {Component, ElementRef, inject, output, viewChild} from '@angular/core';

const ALERT_DIALOG_CONTEXT = Symbol('AlertDialogContext');

@Component({
    selector: 'fb-alert-dialog',
    templateUrl: './alert-dialog.component.html',
    providers: [{provide: ALERT_DIALOG_CONTEXT, useExisting: AlertDialogComponent}],
})
export class AlertDialogComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    confirmed = output<void>();

    open(): void {
        this.dialogEl().nativeElement.showModal();
    }

    close(): void {
        this.dialogEl().nativeElement.close();
    }

    confirm(): void {
        this.confirmed.emit();
        this.close();
    }
}

@Component({
    selector: 'fb-alert-dialog-header',
    host: {class: 'flex flex-col gap-1.5 mb-4 block'},
    template: '<ng-content />',
})
export class AlertDialogHeaderComponent {
}

@Component({
    selector: 'fb-alert-dialog-title',
    host: {class: 'text-lg font-semibold leading-none tracking-tight block'},
    template: '<ng-content />',
})
export class AlertDialogTitleComponent {
}

@Component({
    selector: 'fb-alert-dialog-description',
    host: {class: 'text-sm text-muted-foreground block'},
    template: '<ng-content />',
})
export class AlertDialogDescriptionComponent {
}

@Component({
    selector: 'fb-alert-dialog-footer',
    host: {class: 'flex justify-end gap-2 mt-6 block'},
    template: '<ng-content />',
})
export class AlertDialogFooterComponent {
}

@Component({
    selector: 'fb-alert-dialog-cancel',
    template: `<button class="btn btn-outline" (click)="dialog.close()"><ng-content /></button>`,
})
export class AlertDialogCancelComponent {
    dialog = inject(ALERT_DIALOG_CONTEXT) as AlertDialogComponent;
}

@Component({
    selector: 'fb-alert-dialog-action',
    template: `<button class="btn btn-destructive" (click)="dialog.confirm()"><ng-content /></button>`,
})
export class AlertDialogActionComponent {
    dialog = inject(ALERT_DIALOG_CONTEXT) as AlertDialogComponent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/alert-dialog/
git commit -m "feat(design-system): add AlertDialog component for destructive confirmations"
```

---

### Task 30: Drawer Component

**Files:**

- Create: `frontend/src/app/shared/components/drawer/drawer.component.ts`
- Create: `frontend/src/app/shared/components/drawer/drawer.component.html`
- Create: `frontend/src/app/shared/components/drawer/drawer.component.spec.ts`

Bottom sheet that slides up. Uses native `<dialog>` with CSS slide-up animation. Has a drag handle for mobile UX.
Sub-components: DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/drawer/drawer.component.spec.ts`:

```typescript
import {Component, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    DrawerComponent,
    DrawerHeaderComponent,
    DrawerTitleComponent,
    DrawerDescriptionComponent,
    DrawerFooterComponent
} from './drawer.component';

@Component({
    template: `
    <fb-drawer #drawer>
      <fb-drawer-header>
        <fb-drawer-title>Edit Profile</fb-drawer-title>
        <fb-drawer-description>Make changes to your profile.</fb-drawer-description>
      </fb-drawer-header>
      <p>Drawer body</p>
      <fb-drawer-footer>
        <button (click)="drawer.close()">Close</button>
      </fb-drawer-footer>
    </fb-drawer>
  `,
    imports: [DrawerComponent, DrawerHeaderComponent, DrawerTitleComponent, DrawerDescriptionComponent, DrawerFooterComponent],
})
class TestHostComponent {
    drawer = viewChild.required<DrawerComponent>('drawer');
}

describe('DrawerComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should be closed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        expect(dialog.open).toBe(false);
    });

    it('should open when open() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.drawer().open();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    });

    it('should close when close() is called', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const comp = fixture.componentInstance.drawer();
        comp.open();
        comp.close();
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });

    it('should render drag handle', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const handle = fixture.nativeElement.querySelector('[data-drag-handle]');
        expect(handle).toBeTruthy();
    });

    it('should render sub-components', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('fb-drawer-title')?.textContent).toContain('Edit Profile');
        expect(el.querySelector('fb-drawer-description')?.textContent).toContain('Make changes');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Drawer component**

Create `frontend/src/app/shared/components/drawer/drawer.component.html`:

```html

<dialog
    #dialogEl
    class="fixed inset-x-0 bottom-0 mt-auto bg-card text-card-foreground rounded-t-xl border-t border-border shadow-lg p-0 w-full max-h-[85vh] backdrop:bg-black/50 m-0"
    (close)="closed.emit()"
>
    <div class="mx-auto w-12 h-1.5 rounded-full bg-muted mt-4" data-drag-handle></div>
    <div class="p-6 overflow-y-auto">
        <ng-content/>
    </div>
</dialog>
```

Create `frontend/src/app/shared/components/drawer/drawer.component.ts`:

```typescript
import {Component, ElementRef, output, viewChild} from '@angular/core';

@Component({
    selector: 'fb-drawer',
    templateUrl: './drawer.component.html',
})
export class DrawerComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    closed = output<void>();

    open(): void {
        this.dialogEl().nativeElement.showModal();
    }

    close(): void {
        this.dialogEl().nativeElement.close();
    }

    get isOpen(): boolean {
        return this.dialogEl().nativeElement.open;
    }
}

@Component({
    selector: 'fb-drawer-header',
    host: {class: 'flex flex-col gap-1.5 mb-4 block'},
    template: '<ng-content />',
})
export class DrawerHeaderComponent {
}

@Component({
    selector: 'fb-drawer-title',
    host: {class: 'text-lg font-semibold leading-none tracking-tight block'},
    template: '<ng-content />',
})
export class DrawerTitleComponent {
}

@Component({
    selector: 'fb-drawer-description',
    host: {class: 'text-sm text-muted-foreground block'},
    template: '<ng-content />',
})
export class DrawerDescriptionComponent {
}

@Component({
    selector: 'fb-drawer-footer',
    host: {class: 'flex justify-end gap-2 mt-6 block'},
    template: '<ng-content />',
})
export class DrawerFooterComponent {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/drawer/
git commit -m "feat(design-system): add Drawer bottom sheet component"
```

---

### Task 31: Hover Card Component

**Files:**

- Create: `frontend/src/app/shared/components/hover-card/hover-card.component.ts`
- Create: `frontend/src/app/shared/components/hover-card/hover-card.component.spec.ts`

Rich tooltip that appears on hover with a delay. Card-style content anchored to trigger element. Similar to Popover (
Task 23) but hover-triggered instead of click-triggered.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/hover-card/hover-card.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {HoverCardComponent, HoverCardTriggerComponent, HoverCardContentComponent} from './hover-card.component';

@Component({
    template: `
    <fb-hover-card>
      <fb-hover-card-trigger>
        <span>Hover me</span>
      </fb-hover-card-trigger>
      <fb-hover-card-content>Rich card content</fb-hover-card-content>
    </fb-hover-card>
  `,
    imports: [HoverCardComponent, HoverCardTriggerComponent, HoverCardContentComponent],
})
class TestHostComponent {
}

describe('HoverCardComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should hide content by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on mouseenter after delay', fakeAsync(() => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-hover-card-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('mouseenter'));
        tick(200);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    }));

    it('should hide content on mouseleave', fakeAsync(() => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-hover-card-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('mouseenter'));
        tick(200);
        fixture.detectChanges();
        trigger.dispatchEvent(new MouseEvent('mouseleave'));
        tick(100);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-hover-card-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Hover Card component**

Create `frontend/src/app/shared/components/hover-card/hover-card.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const HOVER_CARD_CONTEXT = Symbol('HoverCardContext');

export class HoverCardContext {
    isOpen = signal(false);
    private openTimer: ReturnType<typeof setTimeout> | null = null;
    private closeTimer: ReturnType<typeof setTimeout> | null = null;

    scheduleOpen(delay = 200): void {
        this.cancelClose();
        this.openTimer = setTimeout(() => this.isOpen.set(true), delay);
    }

    scheduleClose(delay = 100): void {
        this.cancelOpen();
        this.closeTimer = setTimeout(() => this.isOpen.set(false), delay);
    }

    cancelOpen(): void {
        if (this.openTimer) {
            clearTimeout(this.openTimer);
            this.openTimer = null;
        }
    }

    cancelClose(): void {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }
    }
}

@Component({
    selector: 'fb-hover-card',
    host: {class: 'relative inline-block'},
    template: '<ng-content />',
    providers: [{provide: HOVER_CARD_CONTEXT, useFactory: () => new HoverCardContext()}],
})
export class HoverCardComponent {
}

@Component({
    selector: 'fb-hover-card-trigger',
    host: {
        class: 'inline-block',
        '(mouseenter)': 'context.scheduleOpen()',
        '(mouseleave)': 'context.scheduleClose()',
    },
    template: '<ng-content />',
})
export class HoverCardTriggerComponent {
    context = inject(HOVER_CARD_CONTEXT);
}

@Component({
    selector: 'fb-hover-card-content',
    host: {
        class: 'absolute z-50 mt-2 w-64 rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-md',
        '[class.hidden]': '!context.isOpen()',
        '(mouseenter)': 'context.cancelClose()',
        '(mouseleave)': 'context.scheduleClose()',
    },
    template: '<ng-content />',
})
export class HoverCardContentComponent {
    context = inject(HOVER_CARD_CONTEXT);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/hover-card/
git commit -m "feat(design-system): add HoverCard component with delayed show/hide"
```

---

### Task 32: Context Menu Component

**Files:**

- Create: `frontend/src/app/shared/components/context-menu/context-menu.component.ts`
- Create: `frontend/src/app/shared/components/context-menu/context-menu.component.spec.ts`

Right-click triggered menu. Positioned at cursor coordinates. Similar to DropdownMenu (Task 24) but triggered by
`contextmenu` event.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/context-menu/context-menu.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    ContextMenuComponent,
    ContextMenuTriggerComponent,
    ContextMenuContentComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent
} from './context-menu.component';

@Component({
    template: `
    <fb-context-menu>
      <fb-context-menu-trigger>
        <div style="width: 200px; height: 100px;">Right-click area</div>
      </fb-context-menu-trigger>
      <fb-context-menu-content>
        <fb-context-menu-item>Copy</fb-context-menu-item>
        <fb-context-menu-separator></fb-context-menu-separator>
        <fb-context-menu-item>Paste</fb-context-menu-item>
      </fb-context-menu-content>
    </fb-context-menu>
  `,
    imports: [ContextMenuComponent, ContextMenuTriggerComponent, ContextMenuContentComponent, ContextMenuItemComponent, ContextMenuSeparatorComponent],
})
class TestHostComponent {
}

describe('ContextMenuComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should hide menu by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-context-menu-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show menu on contextmenu event', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-context-menu-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('contextmenu', {clientX: 100, clientY: 50, bubbles: true}));
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-context-menu-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-context-menu-trigger') as HTMLElement;
        trigger.dispatchEvent(new MouseEvent('contextmenu', {clientX: 100, clientY: 50, bubbles: true}));
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-context-menu-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-context-menu-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should render menu items and separator', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Copy');
        expect(el.textContent).toContain('Paste');
        expect(el.querySelector('fb-context-menu-separator')).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Context Menu component**

Create `frontend/src/app/shared/components/context-menu/context-menu.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const CONTEXT_MENU_CONTEXT = Symbol('ContextMenuContext');

export class ContextMenuContext {
    isOpen = signal(false);
    posX = signal(0);
    posY = signal(0);

    openAt(x: number, y: number): void {
        this.posX.set(x);
        this.posY.set(y);
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

@Component({
    selector: 'fb-context-menu',
    host: {class: 'block'},
    template: '<ng-content />',
    providers: [{provide: CONTEXT_MENU_CONTEXT, useFactory: () => new ContextMenuContext()}],
})
export class ContextMenuComponent {
}

@Component({
    selector: 'fb-context-menu-trigger',
    host: {
        class: 'block',
        '(contextmenu)': 'onContextMenu($event)',
    },
    template: '<ng-content />',
})
export class ContextMenuTriggerComponent {
    private context = inject(CONTEXT_MENU_CONTEXT);

    onContextMenu(event: MouseEvent): void {
        event.preventDefault();
        this.context.openAt(event.clientX, event.clientY);
    }
}

@Component({
    selector: 'fb-context-menu-content',
    host: {
        class: 'fixed z-50 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
        '[class.hidden]': '!context.isOpen()',
        '[style.left.px]': 'context.posX()',
        '[style.top.px]': 'context.posY()',
    },
    template: '<ng-content />',
})
export class ContextMenuContentComponent {
    context = inject(CONTEXT_MENU_CONTEXT);
}

@Component({
    selector: 'fb-context-menu-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
        '(click)': 'context.close()',
    },
    template: '<ng-content />',
})
export class ContextMenuItemComponent {
    context = inject(CONTEXT_MENU_CONTEXT);
}

@Component({
    selector: 'fb-context-menu-separator',
    host: {class: 'block -mx-1 my-1 h-px bg-border'},
    template: '',
})
export class ContextMenuSeparatorComponent {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/context-menu/
git commit -m "feat(design-system): add ContextMenu component"
```

---

### Task 33: Menubar Component

**Files:**

- Create: `frontend/src/app/shared/components/menubar/menubar.component.ts`
- Create: `frontend/src/app/shared/components/menubar/menubar.component.spec.ts`

Horizontal app-style menu bar with dropdown menus. Composed of MenubarMenu (group), MenubarTrigger (click to open),
MenubarContent (dropdown), and MenubarItem.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/menubar/menubar.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    MenubarComponent,
    MenubarMenuComponent,
    MenubarTriggerComponent,
    MenubarContentComponent,
    MenubarItemComponent,
    MenubarSeparatorComponent
} from './menubar.component';

@Component({
    template: `
    <fb-menubar>
      <fb-menubar-menu>
        <fb-menubar-trigger>File</fb-menubar-trigger>
        <fb-menubar-content>
          <fb-menubar-item>New</fb-menubar-item>
          <fb-menubar-separator></fb-menubar-separator>
          <fb-menubar-item>Open</fb-menubar-item>
        </fb-menubar-content>
      </fb-menubar-menu>
      <fb-menubar-menu>
        <fb-menubar-trigger>Edit</fb-menubar-trigger>
        <fb-menubar-content>
          <fb-menubar-item>Undo</fb-menubar-item>
        </fb-menubar-content>
      </fb-menubar-menu>
    </fb-menubar>
  `,
    imports: [MenubarComponent, MenubarMenuComponent, MenubarTriggerComponent, MenubarContentComponent, MenubarItemComponent, MenubarSeparatorComponent],
})
class TestHostComponent {
}

describe('MenubarComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render all menu triggers', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const triggers = fixture.nativeElement.querySelectorAll('fb-menubar-trigger') as NodeListOf<HTMLElement>;
        expect(triggers.length).toBe(2);
        expect(triggers[0].textContent).toContain('File');
        expect(triggers[1].textContent).toContain('Edit');
    });

    it('should hide all menus by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll('fb-menubar-content') as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(true);
        expect(contents[1].classList.contains('hidden')).toBe(true);
    });

    it('should open menu on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const contents = fixture.nativeElement.querySelectorAll('fb-menubar-content') as NodeListOf<HTMLElement>;
        expect(contents[0].classList.contains('hidden')).toBe(false);
    });

    it('should close menu on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-menubar-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-menubar-item') as HTMLElement;
        item.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-menubar-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Menubar component**

Create `frontend/src/app/shared/components/menubar/menubar.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const MENUBAR_MENU_CONTEXT = Symbol('MenubarMenuContext');

export class MenubarMenuContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update(v => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

@Component({
    selector: 'fb-menubar',
    host: {class: 'flex items-center gap-1 rounded-md border border-border bg-background p-1'},
    template: '<ng-content />',
})
export class MenubarComponent {
}

@Component({
    selector: 'fb-menubar-menu',
    host: {class: 'relative inline-block'},
    template: '<ng-content />',
    providers: [{provide: MENUBAR_MENU_CONTEXT, useFactory: () => new MenubarMenuContext()}],
})
export class MenubarMenuComponent {
}

@Component({
    selector: 'fb-menubar-trigger',
    host: {
        class: 'flex items-center rounded-sm px-3 py-1.5 text-sm font-medium cursor-pointer outline-none hover:bg-accent/10 transition-colors',
        '(click)': 'context.toggle()',
    },
    template: '<ng-content />',
})
export class MenubarTriggerComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'fb-menubar-content',
    host: {
        class: 'absolute z-50 mt-1 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground p-1 shadow-md',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class MenubarContentComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'fb-menubar-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10 block',
        '(click)': 'context.close()',
    },
    template: '<ng-content />',
})
export class MenubarItemComponent {
    context = inject(MENUBAR_MENU_CONTEXT);
}

@Component({
    selector: 'fb-menubar-separator',
    host: {class: 'block -mx-1 my-1 h-px bg-border'},
    template: '',
})
export class MenubarSeparatorComponent {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/menubar/
git commit -m "feat(design-system): add Menubar component with dropdown menus"
```

---

### Task 34: Navigation Menu Component

**Files:**

- Create: `frontend/src/app/shared/components/navigation-menu/navigation-menu.component.ts`
- Create: `frontend/src/app/shared/components/navigation-menu/navigation-menu.component.spec.ts`

Site navigation with optional mega-menu support. Used in the Landing page sticky navbar. Composed of NavigationMenuItem,
NavigationMenuTrigger, NavigationMenuContent.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/navigation-menu/navigation-menu.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    NavigationMenuComponent,
    NavigationMenuItemComponent,
    NavigationMenuTriggerComponent,
    NavigationMenuContentComponent,
    NavigationMenuLinkComponent
} from './navigation-menu.component';

@Component({
    template: `
    <fb-navigation-menu>
      <fb-navigation-menu-item>
        <fb-navigation-menu-trigger>Features</fb-navigation-menu-trigger>
        <fb-navigation-menu-content>
          <fb-navigation-menu-link>Predictions</fb-navigation-menu-link>
          <fb-navigation-menu-link>Leagues</fb-navigation-menu-link>
        </fb-navigation-menu-content>
      </fb-navigation-menu-item>
      <fb-navigation-menu-item>
        <fb-navigation-menu-link>Pricing</fb-navigation-menu-link>
      </fb-navigation-menu-item>
    </fb-navigation-menu>
  `,
    imports: [NavigationMenuComponent, NavigationMenuItemComponent, NavigationMenuTriggerComponent, NavigationMenuContentComponent, NavigationMenuLinkComponent],
})
class TestHostComponent {
}

describe('NavigationMenuComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should render all menu items', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll('fb-navigation-menu-item') as NodeListOf<HTMLElement>;
        expect(items.length).toBe(2);
    });

    it('should hide content by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-navigation-menu-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(true);
    });

    it('should show content on trigger click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-navigation-menu-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector('fb-navigation-menu-content') as HTMLElement;
        expect(content.classList.contains('hidden')).toBe(false);
    });

    it('should render links inside content', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const trigger = fixture.nativeElement.querySelector('fb-navigation-menu-trigger') as HTMLElement;
        trigger.click();
        fixture.detectChanges();
        const links = fixture.nativeElement.querySelectorAll('fb-navigation-menu-link') as NodeListOf<HTMLElement>;
        expect(links[0].textContent).toContain('Predictions');
        expect(links[1].textContent).toContain('Leagues');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Navigation Menu component**

Create `frontend/src/app/shared/components/navigation-menu/navigation-menu.component.ts`:

```typescript
import {Component, inject, signal} from '@angular/core';

const NAV_MENU_ITEM_CONTEXT = Symbol('NavMenuItemContext');

export class NavMenuItemContext {
    isOpen = signal(false);

    toggle(): void {
        this.isOpen.update(v => !v);
    }

    close(): void {
        this.isOpen.set(false);
    }
}

@Component({
    selector: 'fb-navigation-menu',
    host: {class: 'relative flex items-center gap-1'},
    template: '<ng-content />',
})
export class NavigationMenuComponent {
}

@Component({
    selector: 'fb-navigation-menu-item',
    host: {class: 'relative'},
    template: '<ng-content />',
    providers: [{provide: NAV_MENU_ITEM_CONTEXT, useFactory: () => new NavMenuItemContext()}],
})
export class NavigationMenuItemComponent {
}

@Component({
    selector: 'fb-navigation-menu-trigger',
    host: {
        class: 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/10 cursor-pointer',
        '(click)': 'context.toggle()',
    },
    template: '<ng-content />',
})
export class NavigationMenuTriggerComponent {
    context = inject(NAV_MENU_ITEM_CONTEXT);
}

@Component({
    selector: 'fb-navigation-menu-content',
    host: {
        class: 'absolute z-50 mt-2 min-w-[12rem] rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-lg',
        '[class.hidden]': '!context.isOpen()',
    },
    template: '<ng-content />',
})
export class NavigationMenuContentComponent {
    context = inject(NAV_MENU_ITEM_CONTEXT);
}

@Component({
    selector: 'fb-navigation-menu-link',
    host: {
        class: 'block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent/10 cursor-pointer',
    },
    template: '<ng-content />',
})
export class NavigationMenuLinkComponent {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/navigation-menu/
git commit -m "feat(design-system): add NavigationMenu component"
```

---

### Task 35: Command Palette Component

**Files:**

- Create: `frontend/src/app/shared/components/command/command.component.ts`
- Create: `frontend/src/app/shared/components/command/command.component.html`
- Create: `frontend/src/app/shared/components/command/command.component.spec.ts`

Searchable command palette (Ctrl+K / Cmd+K pattern). Search input with a filterable list of actions rendered inside a
Dialog. Composed of CommandGroup, CommandItem, and CommandEmpty.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/command/command.component.spec.ts`:

```typescript
import {Component, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {
    CommandComponent,
    CommandGroupComponent,
    CommandItemComponent,
    CommandEmptyComponent
} from './command.component';

@Component({
    template: `
    <fb-command #cmd>
      <fb-command-group heading="Actions">
        <fb-command-item value="profile">Go to Profile</fb-command-item>
        <fb-command-item value="settings">Open Settings</fb-command-item>
      </fb-command-group>
      <fb-command-group heading="Pages">
        <fb-command-item value="dashboard">Dashboard</fb-command-item>
      </fb-command-group>
      <fb-command-empty>No results found.</fb-command-empty>
    </fb-command>
  `,
    imports: [CommandComponent, CommandGroupComponent, CommandItemComponent, CommandEmptyComponent],
})
class TestHostComponent {
    cmd = viewChild.required<CommandComponent>('cmd');
}

describe('CommandComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();
    });

    it('should be closed by default', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
        expect(dialog.open).toBe(false);
    });

    it('should open and show search input', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector('input[data-command-input]') as HTMLInputElement;
        expect(input).toBeTruthy();
    });

    it('should render all items when no search', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const items = fixture.nativeElement.querySelectorAll('fb-command-item') as NodeListOf<HTMLElement>;
        expect(items.length).toBe(3);
    });

    it('should filter items based on search', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector('input[data-command-input]') as HTMLInputElement;
        input.value = 'profile';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const visibleItems = fixture.nativeElement.querySelectorAll('fb-command-item:not(.hidden)') as NodeListOf<HTMLElement>;
        expect(visibleItems.length).toBe(1);
        expect(visibleItems[0].textContent).toContain('Go to Profile');
    });

    it('should show empty message when no matches', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector('input[data-command-input]') as HTMLInputElement;
        input.value = 'zzzznothing';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        const empty = fixture.nativeElement.querySelector('fb-command-empty') as HTMLElement;
        expect(empty.classList.contains('hidden')).toBe(false);
    });

    it('should emit selected and close on item click', () => {
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
        let selectedValue = '';
        fixture.componentInstance.cmd().selected.subscribe((v: string) => selectedValue = v);
        fixture.componentInstance.cmd().open();
        fixture.detectChanges();
        const item = fixture.nativeElement.querySelector('fb-command-item') as HTMLElement;
        item.click();
        expect(selectedValue).toBe('profile');
        expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Command palette component**

Create `frontend/src/app/shared/components/command/command.component.html`:

```html

<dialog
    #dialogEl
    class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
>
    <div class="flex items-center border-b border-border px-3">
        <svg class="h-4 w-4 shrink-0 opacity-50 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
        </svg>
        <input
            data-command-input
            class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Type a command or search..."
            [value]="search()"
            (input)="onSearch($event)"
        />
    </div>
    <div class="max-h-[300px] overflow-y-auto p-2">
        <ng-content/>
    </div>
</dialog>
```

Create `frontend/src/app/shared/components/command/command.component.ts`:

```typescript
import {Component, ElementRef, computed, inject, input, output, signal, viewChild} from '@angular/core';

const COMMAND_CONTEXT = Symbol('CommandContext');

@Component({
    selector: 'fb-command',
    templateUrl: './command.component.html',
    providers: [{provide: COMMAND_CONTEXT, useExisting: CommandComponent}],
})
export class CommandComponent {
    private dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
    search = signal('');
    selected = output<string>();

    open(): void {
        this.search.set('');
        this.dialogEl().nativeElement.showModal();
    }

    close(): void {
        this.dialogEl().nativeElement.close();
    }

    selectItem(value: string): void {
        this.selected.emit(value);
        this.close();
    }

    onSearch(event: Event): void {
        this.search.set((event.target as HTMLInputElement).value);
    }

    hasVisibleItems(): boolean {
        const dialog = this.dialogEl().nativeElement;
        const items = dialog.querySelectorAll('fb-command-item:not(.hidden)');
        return items.length > 0;
    }
}

@Component({
    selector: 'fb-command-group',
    host: {class: 'block'},
    template: `
    <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">{{ heading() }}</div>
    <ng-content />
  `,
})
export class CommandGroupComponent {
    heading = input('');
}

@Component({
    selector: 'fb-command-item',
    host: {
        class: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/10',
        '[class.hidden]': '!isVisible()',
        '(click)': 'onSelect()',
    },
    template: '<ng-content />',
})
export class CommandItemComponent {
    private command = inject(COMMAND_CONTEXT) as CommandComponent;
    value = input.required<string>();
    private el = inject(ElementRef);

    isVisible = computed(() => {
        const query = this.command.search().toLowerCase();
        if (!query) return true;
        const text = this.el.nativeElement.textContent?.toLowerCase() ?? '';
        return text.includes(query);
    });

    onSelect(): void {
        this.command.selectItem(this.value());
    }
}

@Component({
    selector: 'fb-command-empty',
    host: {
        class: 'py-6 text-center text-sm text-muted-foreground',
        '[class.hidden]': 'command.hasVisibleItems()',
    },
    template: '<ng-content />',
})
export class CommandEmptyComponent {
    command = inject(COMMAND_CONTEXT) as CommandComponent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/command/
git commit -m "feat(design-system): add Command palette component with search filtering"
```

---

### Task 36: Barrel Exports & Verification

**Files:**
- Create: `frontend/src/app/shared/components/index.ts`
- Create: `frontend/src/app/shared/directives/index.ts`

Create barrel exports for all shared components and directives, then run the full test suite.

- [ ] **Step 1: Create component barrel export**

Create `frontend/src/app/shared/components/index.ts`:

```typescript
export {InputFieldComponent} from './input/input-field.component';
export {CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent} from './card/card.component';
export {DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent} from './dialog/dialog.component';
export {TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent} from './tabs/tabs.component';
export {ProgressComponent} from './progress/progress.component';
export {ToastService} from './toast/toast.service';
export {ToasterComponent} from './toast/toast.component';
export {SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent, SidebarTriggerComponent, SidebarService} from './sidebar/sidebar.component';
export {TextareaComponent} from './textarea/textarea.component';
export {CheckboxComponent} from './checkbox/checkbox.component';
export {RadioGroupComponent, RadioGroupItemComponent} from './radio-group/radio-group.component';
export {SelectComponent, SelectItemComponent} from './select/select.component';
export {SwitchComponent} from './switch/switch.component';
export {SliderComponent} from './slider/slider.component';
export {ToggleComponent, ToggleGroupComponent, ToggleGroupItemComponent} from './toggle/toggle.component';
export {FormGroupComponent} from './form-group/form-group.component';
export {SkeletonComponent} from './skeleton/skeleton.component';
export {AlertComponent, AlertTitleComponent, AlertDescriptionComponent} from './alert/alert.component';
export {AccordionComponent, AccordionItemComponent, AccordionTriggerComponent, AccordionContentComponent} from './accordion/accordion.component';
export {TableComponent, TableHeaderComponent, TableBodyComponent, TableRowComponent, TableHeadComponent, TableCellComponent} from './table/table.component';
export {PopoverComponent, PopoverTriggerComponent, PopoverContentComponent} from './popover/popover.component';
export {DropdownMenuComponent, DropdownMenuTriggerComponent, DropdownMenuContentComponent, DropdownMenuItemComponent, DropdownMenuSeparatorComponent} from './dropdown-menu/dropdown-menu.component';
export {PaginationComponent} from './pagination/pagination.component';
export {
    CollapsibleComponent, CollapsibleTriggerComponent, CollapsibleContentComponent
} from './collapsible/collapsible.component';
export {ScrollAreaComponent} from './scroll-area/scroll-area.component';
export {InputOtpComponent} from './input-otp/input-otp.component';
export {
    AlertDialogComponent,
    AlertDialogHeaderComponent,
    AlertDialogTitleComponent,
    AlertDialogDescriptionComponent,
    AlertDialogFooterComponent,
    AlertDialogActionComponent,
    AlertDialogCancelComponent
} from './alert-dialog/alert-dialog.component';
export {
    DrawerComponent, DrawerHeaderComponent, DrawerTitleComponent, DrawerDescriptionComponent, DrawerFooterComponent
} from './drawer/drawer.component';
export {
    HoverCardComponent, HoverCardTriggerComponent, HoverCardContentComponent
} from './hover-card/hover-card.component';
export {
    ContextMenuComponent,
    ContextMenuTriggerComponent,
    ContextMenuContentComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent
} from './context-menu/context-menu.component';
export {
    MenubarComponent,
    MenubarMenuComponent,
    MenubarTriggerComponent,
    MenubarContentComponent,
    MenubarItemComponent,
    MenubarSeparatorComponent
} from './menubar/menubar.component';
export {
    NavigationMenuComponent,
    NavigationMenuItemComponent,
    NavigationMenuTriggerComponent,
    NavigationMenuContentComponent,
    NavigationMenuLinkComponent
} from './navigation-menu/navigation-menu.component';
export {
    CommandComponent, CommandGroupComponent, CommandItemComponent, CommandEmptyComponent
} from './command/command.component';
```

- [ ] **Step 2: Create directives barrel export**

Create `frontend/src/app/shared/directives/index.ts`:

```typescript
export {TooltipDirective} from './tooltip.directive';
```

- [ ] **Step 3: Run full test suite**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -30`
Expected: All tests pass.

- [ ] **Step 4: Run full build**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -10`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Run lint**

Run: `builtin cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng lint 2>&1 | tail -10`
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/index.ts frontend/src/app/shared/directives/index.ts
git commit -m "feat(design-system): add barrel exports for shared components and directives"
```

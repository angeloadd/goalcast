# Design System Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Fantabet design system as reusable Angular components and Tailwind utilities, ready for page-level composition.

**Architecture:** Standalone Angular components with Tailwind v4 `@utility` directives for visual-only styles. Behavioral components (Dialog, Tabs, Sidebar, etc.) are Angular components. Domain components (MatchCard, StatsCards, etc.) compose primitives. All components are headless-first — minimal internal state, inputs/outputs for external control.

**Tech Stack:** Angular 21, Tailwind CSS v4, Angular signals (for component state), Bootstrap Icons via `@ng-icons/bootstrap-icons`, Vitest for testing.

**Specs:**
- Design system: `docs/superpowers/specs/2026-04-02-fantabet-design-system-design.md`
- Profile & flow: `docs/superpowers/specs/2026-04-04-profile-and-application-flow-design.md`

**What's already built:**
- `styles.scss` — design tokens (CSS vars), button classes in `@layer components`, card classes, sidebar gradient, rank badges, page headers. Missing: badge, label, separator, form-label utilities.
- `InputFieldComponent` — shared form input with validation. Uses Heroicons (needs switch to Bootstrap Icons). Has debug `console.log` to remove.
- `LoginComponent`, `RegisterComponent`, `DashboardComponent` — exist but minimal. Not in scope to modify (page-level).

**What's NOT in scope:**
- Page components (Landing, Login, Register, Profile, Dashboard pages)
- Routing, guards, navigation logic
- Backend API integration, NGRx state for leagues
- LeagueEditModal (requires backend wiring for members/invites)

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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
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

The spec requires Bootstrap Icons via `@ng-icons/bootstrap-icons`. Currently using `@ng-icons/heroicons`.

- [ ] **Step 1: Install bootstrap-icons, uninstall heroicons**

Run:
```bash
cd /Volumes/CaseSensitive/src/fantabet/frontend && npm install @ng-icons/bootstrap-icons && npm uninstall @ng-icons/heroicons
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
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

Define all domain interfaces needed by components. These come from the design system spec section 4.

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
  avatar?: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}

export interface Winner {
  year: number;
  name: string;
  avatar?: string;
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -5`
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

The Card is the most-used component in the design system. It uses content projection with sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter.

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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Dialog component**

Create `frontend/src/app/shared/components/dialog/dialog.component.ts`:

```typescript
import {Component, ElementRef, output, viewChild} from '@angular/core';

@Component({
  selector: 'fb-dialog',
  template: `
    <dialog
      #dialogEl
      class="bg-card text-card-foreground rounded-xl border border-border shadow-lg p-0 w-full max-w-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      (close)="closed.emit()"
    >
      <div class="p-6">
        <ng-content />
      </div>
    </dialog>
  `,
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
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

Used in League Edit Modal (2 tabs), Predictions page (3 tabs).

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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
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

  constructor() {
    // Sync initial value into context; we need an effect-like behavior.
    // Using a computed + ngOnInit pattern.
  }

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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/tabs/
git commit -m "feat(design-system): add Tabs component with trigger and content"
```

---

### Task 7: Avatar Component

**Files:**
- Create: `frontend/src/app/shared/components/avatar/avatar.component.ts`
- Create: `frontend/src/app/shared/components/avatar/avatar.component.spec.ts`

Circular avatar with fallback initials. Multiple sizes used across ranking, sidebar, profile.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/avatar/avatar.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {AvatarComponent} from './avatar.component';

describe('AvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();
  });

  it('should show fallback when no src provided', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('fallback', 'AB');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AB');
    expect(el.querySelector('img')).toBeNull();
  });

  it('should show image when src is provided', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', 'https://example.com/avatar.jpg');
    fixture.componentRef.setInput('alt', 'User');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.jpg');
  });

  it('should apply size class', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('fallback', 'X');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const el = fixture.nativeElement.firstElementChild as HTMLElement;
    expect(el.classList.contains('w-16')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Avatar component**

Create `frontend/src/app/shared/components/avatar/avatar.component.ts`:

```typescript
import {Component, computed, input, signal} from '@angular/core';

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

@Component({
  selector: 'fb-avatar',
  template: `
    <div [class]="containerClass()">
      @if (src() && !imgError()) {
        <img
          [src]="src()"
          [alt]="alt()"
          class="w-full h-full object-cover rounded-full"
          (error)="onImgError()"
        />
      } @else {
        <span class="font-medium select-none">{{ fallback() }}</span>
      }
    </div>
  `,
})
export class AvatarComponent {
  src = input<string | undefined>(undefined);
  alt = input<string>('');
  fallback = input<string>('');
  size = input<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  imgError = signal(false);

  containerClass = computed(() => {
    const sizeClass = SIZE_CLASSES[this.size()];
    return `inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden ${sizeClass}`;
  });

  onImgError(): void {
    this.imgError.set(true);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/avatar/
git commit -m "feat(design-system): add Avatar component with fallback support"
```

---

### Task 8: Progress Component

**Files:**
- Create: `frontend/src/app/shared/components/progress/progress.component.ts`
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Progress component**

Create `frontend/src/app/shared/components/progress/progress.component.ts`:

```typescript
import {Component, computed, input} from '@angular/core';

@Component({
  selector: 'fb-progress',
  host: {class: 'block w-full bg-secondary rounded-full overflow-hidden'},
  template: `
    <div
      data-fill
      class="h-full bg-accent rounded-full transition-all duration-300"
      [style.width.%]="clampedValue()"
    ></div>
  `,
  styles: `:host { height: 0.5rem; }`,
})
export class ProgressComponent {
  value = input<number>(0);
  clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/progress/
git commit -m "feat(design-system): add Progress bar component"
```

---

### Task 9: Toast Service

**Files:**
- Create: `frontend/src/app/shared/components/toast/toast.service.ts`
- Create: `frontend/src/app/shared/components/toast/toast.component.ts`
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
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
  template: `
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
  `,
})
export class ToasterComponent {
  toastService = inject(ToastService);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/toast/
git commit -m "feat(design-system): add Toast service and Toaster component"
```

---

### Task 10: Sidebar Component

**Files:**
- Create: `frontend/src/app/shared/components/sidebar/sidebar.component.ts`
- Create: `frontend/src/app/shared/components/sidebar/sidebar.component.spec.ts`

Navy gradient sidebar with collapsible mobile behavior. Uses a service for open/close state.

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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Sidebar component**

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
  template: `
    <aside
      class="sidebar-gradient text-sidebar-foreground h-full flex flex-col transition-transform duration-300 w-64"
      [class.-translate-x-full]="!sidebarService.isOpen()"
      [class.translate-x-0]="sidebarService.isOpen()"
    >
      <ng-content />
    </aside>
  `,
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

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/sidebar/
git commit -m "feat(design-system): add Sidebar component with service-based toggle"
```

---

### Task 11: AppSidebar Component

**Files:**
- Create: `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.ts`
- Create: `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.html`
- Create: `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.spec.ts`

The Fantabet-specific sidebar with logo, navigation menu items, and user profile footer. Composes the generic Sidebar component.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {AppSidebarComponent} from './app-sidebar.component';
import {SidebarService} from '@fb/shared/components/sidebar/sidebar.component';

describe('AppSidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [provideRouter([]), SidebarService],
    }).compileComponents();
  });

  it('should render the logo', () => {
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('FANTABET');
  });

  it('should render navigation items', () => {
    const fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dashboard');
    expect(el.textContent).toContain('My Predictions');
    expect(el.textContent).toContain('Full Ranking');
    expect(el.textContent).toContain('Past Winners');
    expect(el.textContent).toContain('Rules');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement AppSidebar component**

Create `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.ts`:

```typescript
import {Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapHouse, bootstrapPencilSquare, bootstrapTrophy, bootstrapAward, bootstrapBook} from '@ng-icons/bootstrap-icons';
import {SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent} from '@fb/shared/components/sidebar/sidebar.component';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'fb-app-sidebar',
  imports: [
    RouterLink, RouterLinkActive, NgIcon,
    SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent,
  ],
  viewProviders: [provideIcons({bootstrapHouse, bootstrapPencilSquare, bootstrapTrophy, bootstrapAward, bootstrapBook})],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  navItems: NavItem[] = [
    {label: 'Dashboard', icon: 'bootstrapHouse', path: './'},
    {label: 'My Predictions', icon: 'bootstrapPencilSquare', path: './predictions'},
    {label: 'Full Ranking', icon: 'bootstrapTrophy', path: './ranking'},
    {label: 'Past Winners', icon: 'bootstrapAward', path: './winners'},
    {label: 'Rules', icon: 'bootstrapBook', path: './rules'},
  ];
}
```

Create `frontend/src/app/shared/components/app-sidebar/app-sidebar.component.html`:

```html
<fb-sidebar>
  <fb-sidebar-header>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
        <ng-icon name="bootstrapTrophy" class="text-primary text-lg" />
      </div>
      <span class="font-display text-xl tracking-wider text-sidebar-foreground">FANTABET</span>
    </div>
  </fb-sidebar-header>

  <fb-sidebar-content>
    <nav class="flex flex-col gap-1">
      @for (item of navItems; track item.path; let i = $index) {
        <a
          [routerLink]="item.path"
          routerLinkActive="bg-sidebar-accent text-sidebar-primary font-medium"
          [routerLinkActiveOptions]="{exact: item.path === './'}"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors animate-slide-in"
          [style.animation-delay.ms]="i * 50"
        >
          <ng-icon [name]="item.icon" class="text-lg" />
          <span class="text-sm">{{ item.label }}</span>
        </a>
      }
    </nav>
  </fb-sidebar-content>

  <fb-sidebar-footer>
    <ng-content />
  </fb-sidebar-footer>
</fb-sidebar>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/app-sidebar/
git commit -m "feat(design-system): add AppSidebar with logo and navigation menu"
```

---

### Task 12: DashboardLayout Shell

**Files:**
- Create: `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.ts`
- Create: `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.html`
- Create: `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.spec.ts`

The authenticated page shell: sidebar + header with league indicator + content area. No routing wired — just the layout structure with `<ng-content>` for page content.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.spec.ts`:

```typescript
import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {DashboardLayoutComponent} from './dashboard-layout.component';
import {SidebarService} from '@fb/shared/components/sidebar/sidebar.component';

@Component({
  template: `<fb-dashboard-layout leagueName="Test League"><p>Page content</p></fb-dashboard-layout>`,
  imports: [DashboardLayoutComponent],
  providers: [SidebarService],
})
class TestHostComponent {}

describe('DashboardLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the header with league name', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test League');
  });

  it('should project page content', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Page content');
  });

  it('should show Change link in header', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Change');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement DashboardLayout component**

Create `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.ts`:

```typescript
import {Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapList, bootstrapBoxArrowRight} from '@ng-icons/bootstrap-icons';
import {AppSidebarComponent} from '@fb/shared/components/app-sidebar/app-sidebar.component';
import {SidebarService, SidebarTriggerComponent} from '@fb/shared/components/sidebar/sidebar.component';
import {AvatarComponent} from '@fb/shared/components/avatar/avatar.component';

@Component({
  selector: 'fb-dashboard-layout',
  imports: [RouterLink, NgIcon, AppSidebarComponent, SidebarTriggerComponent, AvatarComponent],
  viewProviders: [provideIcons({bootstrapList, bootstrapBoxArrowRight})],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent {
  sidebarService = inject(SidebarService);
  leagueName = input<string>('');
  username = input<string>('');
}
```

Create `frontend/src/app/shared/components/dashboard-layout/dashboard-layout.component.html`:

```html
<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <div class="hidden lg:block shrink-0">
    <fb-app-sidebar>
      <div class="flex items-center gap-3">
        <fb-avatar [fallback]="(username() || '?')[0].toUpperCase()" size="sm" />
        <span class="text-sm text-sidebar-foreground/70">{{ username() }}</span>
      </div>
    </fb-app-sidebar>
  </div>

  <!-- Main area -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Header -->
    <header class="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <fb-sidebar-trigger>
          <ng-icon name="bootstrapList" class="text-xl" />
        </fb-sidebar-trigger>
        @if (leagueName()) {
          <div class="flex items-center gap-2">
            <span class="badge badge-default text-xs">{{ leagueName() }}</span>
            <a routerLink="/profile" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Change</a>
          </div>
        }
      </div>
      <div class="flex items-center gap-3">
        <a routerLink="/profile" class="btn btn-ghost btn-sm text-xs">
          <ng-icon name="bootstrapBoxArrowRight" />
          Logout
        </a>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 p-6 overflow-auto">
      <ng-content />
    </main>
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/dashboard-layout/
git commit -m "feat(design-system): add DashboardLayout shell with header and sidebar"
```

---

### Task 13: Footer Component

**Files:**
- Create: `frontend/src/app/shared/components/footer/footer.component.ts`
- Create: `frontend/src/app/shared/components/footer/footer.component.spec.ts`

Site-wide footer with legal links.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/footer/footer.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {FooterComponent} from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render copyright text', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fantabet');
  });

  it('should render legal links', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Terms');
    expect(el.textContent).toContain('Privacy');
    expect(el.textContent).toContain('Imprint');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement Footer component**

Create `frontend/src/app/shared/components/footer/footer.component.ts`:

```typescript
import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'fb-footer',
  imports: [RouterLink],
  template: `
    <footer class="border-t border-border bg-card/50 py-8 px-6">
      <div class="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-sm text-muted-foreground">&copy; 2026 Fantabet. All rights reserved.</p>
        <nav class="flex items-center gap-4">
          <a routerLink="/terms" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          <a routerLink="/privacy" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          <a routerLink="/imprint" class="text-xs text-muted-foreground hover:text-foreground transition-colors">Imprint</a>
        </nav>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/footer/
git commit -m "feat(design-system): add Footer component with legal links"
```

---

### Task 14: MatchCard Domain Component

**Files:**
- Create: `frontend/src/app/shared/components/match-card/match-card.component.ts`
- Create: `frontend/src/app/shared/components/match-card/match-card.component.html`
- Create: `frontend/src/app/shared/components/match-card/match-card.component.spec.ts`

Displays a match with two teams, date/time, optional scores, and phase badge.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/match-card/match-card.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {MatchCardComponent} from './match-card.component';
import {Match} from '@fb/shared/models';

const mockMatch: Match = {
  id: '1',
  homeTeam: 'Brazil',
  awayTeam: 'Germany',
  homeFlag: '\uD83C\uDDE7\uD83C\uDDF7',
  awayFlag: '\uD83C\uDDE9\uD83C\uDDEA',
  date: '2026-06-15',
  time: '18:00',
  stage: 'Group A',
  phase: 'group',
  status: 'upcoming',
  predictionsEnabled: true,
};

describe('MatchCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchCardComponent],
    }).compileComponents();
  });

  it('should render team names', () => {
    const fixture = TestBed.createComponent(MatchCardComponent);
    fixture.componentRef.setInput('match', mockMatch);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Brazil');
    expect(el.textContent).toContain('Germany');
  });

  it('should show VS when no score', () => {
    const fixture = TestBed.createComponent(MatchCardComponent);
    fixture.componentRef.setInput('match', mockMatch);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('vs');
  });

  it('should show score when available', () => {
    const fixture = TestBed.createComponent(MatchCardComponent);
    fixture.componentRef.setInput('match', {...mockMatch, homeScore: 2, awayScore: 1, status: 'finished' as const});
    fixture.componentRef.setInput('showResult', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('1');
  });

  it('should show stage badge', () => {
    const fixture = TestBed.createComponent(MatchCardComponent);
    fixture.componentRef.setInput('match', mockMatch);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Group A');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement MatchCard component**

Create `frontend/src/app/shared/components/match-card/match-card.component.ts`:

```typescript
import {Component, input} from '@angular/core';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapCalendar, bootstrapClock} from '@ng-icons/bootstrap-icons';
import {Match} from '@fb/shared/models';

@Component({
  selector: 'fb-match-card',
  imports: [NgIcon],
  viewProviders: [provideIcons({bootstrapCalendar, bootstrapClock})],
  templateUrl: './match-card.component.html',
})
export class MatchCardComponent {
  match = input.required<Match>();
  showResult = input(false);
}
```

Create `frontend/src/app/shared/components/match-card/match-card.component.html`:

```html
<div class="match-card">
  <div class="flex items-center justify-between mb-3">
    <span class="badge badge-accent">{{ match().stage }}</span>
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <ng-icon name="bootstrapCalendar" class="text-sm" />
      <span>{{ match().date }}</span>
      <ng-icon name="bootstrapClock" class="text-sm" />
      <span>{{ match().time }}</span>
    </div>
  </div>

  <div class="flex items-center justify-center gap-6">
    <!-- Home team -->
    <div class="flex flex-col items-center gap-1 flex-1">
      <span class="text-2xl">{{ match().homeFlag }}</span>
      <span class="font-medium text-sm text-center">{{ match().homeTeam }}</span>
    </div>

    <!-- Score or VS -->
    @if (showResult() && match().homeScore !== undefined && match().awayScore !== undefined) {
      <div class="text-xl font-bold">
        {{ match().homeScore }} - {{ match().awayScore }}
      </div>
    } @else {
      <span class="text-lg text-muted-foreground font-medium">vs</span>
    }

    <!-- Away team -->
    <div class="flex flex-col items-center gap-1 flex-1">
      <span class="text-2xl">{{ match().awayFlag }}</span>
      <span class="font-medium text-sm text-center">{{ match().awayTeam }}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/match-card/
git commit -m "feat(design-system): add MatchCard domain component"
```

---

### Task 15: StatsCards Domain Component

**Files:**
- Create: `frontend/src/app/shared/components/stats-cards/stats-cards.component.ts`
- Create: `frontend/src/app/shared/components/stats-cards/stats-cards.component.html`
- Create: `frontend/src/app/shared/components/stats-cards/stats-cards.component.spec.ts`

Grid of 4 stat cards showing user performance metrics.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/stats-cards/stats-cards.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {StatsCardsComponent} from './stats-cards.component';

describe('StatsCardsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCardsComponent],
    }).compileComponents();
  });

  it('should render all four stat cards', () => {
    const fixture = TestBed.createComponent(StatsCardsComponent);
    fixture.componentRef.setInput('points', 120);
    fixture.componentRef.setInput('rank', 3);
    fixture.componentRef.setInput('accuracy', 72);
    fixture.componentRef.setInput('totalPredictions', 45);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('120');
    expect(el.textContent).toContain('3');
    expect(el.textContent).toContain('72%');
    expect(el.textContent).toContain('45');
  });

  it('should render stat labels', () => {
    const fixture = TestBed.createComponent(StatsCardsComponent);
    fixture.componentRef.setInput('points', 0);
    fixture.componentRef.setInput('rank', 0);
    fixture.componentRef.setInput('accuracy', 0);
    fixture.componentRef.setInput('totalPredictions', 0);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Points');
    expect(el.textContent).toContain('Rank');
    expect(el.textContent).toContain('Accuracy');
    expect(el.textContent).toContain('Predictions');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement StatsCards component**

Create `frontend/src/app/shared/components/stats-cards/stats-cards.component.ts`:

```typescript
import {Component, input} from '@angular/core';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapTrophy, bootstrapBarChart, bootstrapBullseye, bootstrapGraphUp} from '@ng-icons/bootstrap-icons';

interface StatItem {
  label: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'fb-stats-cards',
  imports: [NgIcon],
  viewProviders: [provideIcons({bootstrapTrophy, bootstrapBarChart, bootstrapBullseye, bootstrapGraphUp})],
  templateUrl: './stats-cards.component.html',
})
export class StatsCardsComponent {
  points = input.required<number>();
  rank = input.required<number>();
  accuracy = input.required<number>();
  totalPredictions = input.required<number>();

  stats: StatItem[] = [
    {label: 'Points', icon: 'bootstrapTrophy', bgColor: 'bg-accent/10', iconColor: 'text-accent'},
    {label: 'Rank', icon: 'bootstrapBarChart', bgColor: 'bg-primary/10', iconColor: 'text-primary'},
    {label: 'Accuracy', icon: 'bootstrapBullseye', bgColor: 'bg-success/10', iconColor: 'text-success'},
    {label: 'Predictions', icon: 'bootstrapGraphUp', bgColor: 'bg-muted', iconColor: 'text-muted-foreground'},
  ];

  getValue(index: number): string {
    switch (index) {
      case 0: return String(this.points());
      case 1: return String(this.rank());
      case 2: return `${this.accuracy()}%`;
      case 3: return String(this.totalPredictions());
      default: return '';
    }
  }
}
```

Create `frontend/src/app/shared/components/stats-cards/stats-cards.component.html`:

```html
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
  @for (stat of stats; track stat.label; let i = $index) {
    <div class="stat-card animate-fade-in" [style.animation-delay.ms]="i * 100">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="stat.bgColor">
          <ng-icon [name]="stat.icon" [class]="stat.iconColor" class="text-lg" />
        </div>
      </div>
      <p class="text-2xl font-bold">{{ getValue(i) }}</p>
      <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
    </div>
  }
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/stats-cards/
git commit -m "feat(design-system): add StatsCards domain component"
```

---

### Task 16: RankingCard Domain Component

**Files:**
- Create: `frontend/src/app/shared/components/ranking-card/ranking-card.component.ts`
- Create: `frontend/src/app/shared/components/ranking-card/ranking-card.component.html`
- Create: `frontend/src/app/shared/components/ranking-card/ranking-card.component.spec.ts`

Compact top-5 leaderboard for dashboard sidebar.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/ranking-card/ranking-card.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RankingCardComponent} from './ranking-card.component';
import {Player} from '@fb/shared/models';

const mockPlayers: Player[] = [
  {id: '1', name: 'Alice', points: 120, correctPredictions: 30, totalPredictions: 40},
  {id: '2', name: 'Bob', points: 110, correctPredictions: 28, totalPredictions: 40},
  {id: '3', name: 'Charlie', points: 100, correctPredictions: 25, totalPredictions: 40},
];

describe('RankingCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render player names', () => {
    const fixture = TestBed.createComponent(RankingCardComponent);
    fixture.componentRef.setInput('players', mockPlayers);
    fixture.componentRef.setInput('currentUserId', '2');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('Bob');
    expect(el.textContent).toContain('Charlie');
  });

  it('should highlight current user', () => {
    const fixture = TestBed.createComponent(RankingCardComponent);
    fixture.componentRef.setInput('players', mockPlayers);
    fixture.componentRef.setInput('currentUserId', '2');
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-player-row]') as NodeListOf<HTMLElement>;
    expect(rows[1].classList.contains('bg-accent/10')).toBe(true);
  });

  it('should show rank badges for top 3', () => {
    const fixture = TestBed.createComponent(RankingCardComponent);
    fixture.componentRef.setInput('players', mockPlayers);
    fixture.componentRef.setInput('currentUserId', '1');
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.rank-badge');
    expect(badges.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement RankingCard component**

Create `frontend/src/app/shared/components/ranking-card/ranking-card.component.ts`:

```typescript
import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapChevronRight} from '@ng-icons/bootstrap-icons';
import {Player} from '@fb/shared/models';
import {AvatarComponent} from '@fb/shared/components/avatar/avatar.component';

@Component({
  selector: 'fb-ranking-card',
  imports: [RouterLink, NgIcon, AvatarComponent],
  viewProviders: [provideIcons({bootstrapChevronRight})],
  templateUrl: './ranking-card.component.html',
})
export class RankingCardComponent {
  players = input.required<Player[]>();
  currentUserId = input.required<string>();

  rankBadgeClass(rank: number): string {
    if (rank === 1) return 'rank-badge rank-badge-gold';
    if (rank === 2) return 'rank-badge rank-badge-silver';
    if (rank === 3) return 'rank-badge rank-badge-bronze';
    return 'rank-badge bg-muted text-muted-foreground';
  }
}
```

Create `frontend/src/app/shared/components/ranking-card/ranking-card.component.html`:

```html
<div class="card-gradient rounded-xl border border-border p-6">
  <h3 class="text-lg font-semibold mb-4">Ranking</h3>

  <div class="flex flex-col gap-2">
    @for (player of players(); track player.id; let i = $index) {
      <div
        data-player-row
        class="flex items-center gap-3 p-2 rounded-lg transition-colors"
        [class.bg-accent/10]="player.id === currentUserId()"
        [class.border]="player.id === currentUserId()"
        [class.border-accent/20]="player.id === currentUserId()"
      >
        <span [class]="rankBadgeClass(i + 1)">{{ i + 1 }}</span>
        <fb-avatar [fallback]="player.name[0]" size="sm" [src]="player.avatar" />
        <span class="text-sm font-medium flex-1">{{ player.name }}</span>
        <span class="text-sm font-bold">{{ player.points }}</span>
      </div>
    }
  </div>

  <a routerLink="./ranking" class="flex items-center justify-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
    View Full Ranking
    <ng-icon name="bootstrapChevronRight" class="text-sm" />
  </a>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/ranking-card/
git commit -m "feat(design-system): add RankingCard domain component"
```

---

### Task 17: TournamentStatus Domain Component

**Files:**
- Create: `frontend/src/app/shared/components/tournament-status/tournament-status.component.ts`
- Create: `frontend/src/app/shared/components/tournament-status/tournament-status.component.html`
- Create: `frontend/src/app/shared/components/tournament-status/tournament-status.component.spec.ts`

Tournament progress overview for dashboard sidebar.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/tournament-status/tournament-status.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {TournamentStatusComponent} from './tournament-status.component';
import {TournamentStatus} from '@fb/shared/models';

const mockStatus: TournamentStatus = {
  currentStage: 'Group Stage',
  matchesPlayed: 24,
  totalMatches: 64,
  teamsRemaining: 32,
  nextPhase: 'Round of 16',
  daysUntilNextPhase: 5,
};

describe('TournamentStatusComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentStatusComponent],
    }).compileComponents();
  });

  it('should render current stage', () => {
    const fixture = TestBed.createComponent(TournamentStatusComponent);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Group Stage');
  });

  it('should render matches played', () => {
    const fixture = TestBed.createComponent(TournamentStatusComponent);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('24');
    expect(fixture.nativeElement.textContent).toContain('64');
  });

  it('should render next phase info', () => {
    const fixture = TestBed.createComponent(TournamentStatusComponent);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Round of 16');
    expect(fixture.nativeElement.textContent).toContain('5');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement TournamentStatus component**

Create `frontend/src/app/shared/components/tournament-status/tournament-status.component.ts`:

```typescript
import {Component, computed, input} from '@angular/core';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapCalendarEvent} from '@ng-icons/bootstrap-icons';
import {TournamentStatus} from '@fb/shared/models';
import {ProgressComponent} from '@fb/shared/components/progress/progress.component';

@Component({
  selector: 'fb-tournament-status',
  imports: [NgIcon, ProgressComponent],
  viewProviders: [provideIcons({bootstrapCalendarEvent})],
  templateUrl: './tournament-status.component.html',
})
export class TournamentStatusComponent {
  status = input.required<TournamentStatus>();
  progressPercent = computed(() => {
    const s = this.status();
    return s.totalMatches > 0 ? Math.round((s.matchesPlayed / s.totalMatches) * 100) : 0;
  });
}
```

Create `frontend/src/app/shared/components/tournament-status/tournament-status.component.html`:

```html
<div class="card-gradient rounded-xl border border-border p-6">
  <h3 class="text-lg font-semibold mb-4">Tournament Status</h3>

  <div class="mb-4">
    <div class="flex justify-between text-sm mb-2">
      <span class="text-muted-foreground">{{ status().currentStage }}</span>
      <span class="font-medium">{{ status().matchesPlayed }} / {{ status().totalMatches }}</span>
    </div>
    <fb-progress [value]="progressPercent()" />
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4">
    <div class="bg-muted/50 rounded-lg p-3 text-center">
      <p class="text-lg font-bold">{{ status().matchesPlayed }}</p>
      <p class="text-xs text-muted-foreground">Matches Played</p>
    </div>
    <div class="bg-muted/50 rounded-lg p-3 text-center">
      <p class="text-lg font-bold">{{ status().teamsRemaining }}</p>
      <p class="text-xs text-muted-foreground">Teams Remaining</p>
    </div>
  </div>

  <div class="bg-accent/10 border border-accent/20 rounded-lg p-3 flex items-center gap-3">
    <ng-icon name="bootstrapCalendarEvent" class="text-accent text-lg" />
    <div>
      <p class="text-sm font-medium">{{ status().nextPhase }}</p>
      <p class="text-xs text-muted-foreground">in {{ status().daysUntilNextPhase }} days</p>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/tournament-status/
git commit -m "feat(design-system): add TournamentStatus domain component"
```

---

### Task 18: LeagueCard Component

**Files:**
- Create: `frontend/src/app/shared/components/league-card/league-card.component.ts`
- Create: `frontend/src/app/shared/components/league-card/league-card.component.html`
- Create: `frontend/src/app/shared/components/league-card/league-card.component.spec.ts`

League card for the profile page hub — shows league info with Member/Pending/Admin badge and action buttons. Full-width stacked layout per the profile flow spec.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shared/components/league-card/league-card.component.spec.ts`:

```typescript
import {TestBed} from '@angular/core/testing';
import {LeagueCardComponent} from './league-card.component';
import {LeagueWithMembership} from '@fb/shared/models';

const adminLeague: LeagueWithMembership = {
  slug: 'family-ciao-league',
  name: 'Family Ciao League',
  tournament: 'World Cup 2026',
  memberCount: 8,
  role: 'ADMIN',
};

const memberLeague: LeagueWithMembership = {
  slug: 'office-champions',
  name: 'Office Champions',
  tournament: 'World Cup 2026',
  memberCount: 15,
  role: 'MEMBER',
};

const pendingLeague: LeagueWithMembership = {
  slug: 'pro-predictors',
  name: 'Pro Predictors',
  tournament: 'World Cup 2026',
  memberCount: 22,
  role: 'PENDING',
};

describe('LeagueCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueCardComponent],
    }).compileComponents();
  });

  it('should render league name and tournament', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', adminLeague);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Family Ciao League');
    expect(fixture.nativeElement.textContent).toContain('World Cup 2026');
  });

  it('should show ADMIN badge for admin role', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', adminLeague);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ADMIN');
  });

  it('should show Enter and Edit buttons for admin', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', adminLeague);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter');
    expect(fixture.nativeElement.textContent).toContain('Edit');
  });

  it('should show only Enter button for member', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', memberLeague);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter');
    expect(fixture.nativeElement.textContent).not.toContain('Edit');
  });

  it('should show pending state with no Enter button', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', pendingLeague);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PENDING');
    expect(fixture.nativeElement.textContent).toContain('Awaiting owner approval');
    expect(fixture.nativeElement.textContent).not.toContain('Enter');
  });

  it('should emit enter event on Enter click', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', adminLeague);
    fixture.detectChanges();
    let emittedSlug = '';
    fixture.componentInstance.enter.subscribe((slug: string) => emittedSlug = slug);
    const enterBtn = fixture.nativeElement.querySelector('[data-action="enter"]') as HTMLButtonElement;
    enterBtn.click();
    expect(emittedSlug).toBe('family-ciao-league');
  });

  it('should emit edit event on Edit click', () => {
    const fixture = TestBed.createComponent(LeagueCardComponent);
    fixture.componentRef.setInput('league', adminLeague);
    fixture.detectChanges();
    let emittedSlug = '';
    fixture.componentInstance.edit.subscribe((slug: string) => emittedSlug = slug);
    const editBtn = fixture.nativeElement.querySelector('[data-action="edit"]') as HTMLButtonElement;
    editBtn.click();
    expect(emittedSlug).toBe('family-ciao-league');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: Implement LeagueCard component**

Create `frontend/src/app/shared/components/league-card/league-card.component.ts`:

```typescript
import {Component, input, output} from '@angular/core';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {bootstrapPeople} from '@ng-icons/bootstrap-icons';
import {LeagueWithMembership} from '@fb/shared/models';

@Component({
  selector: 'fb-league-card',
  imports: [NgIcon],
  viewProviders: [provideIcons({bootstrapPeople})],
  templateUrl: './league-card.component.html',
})
export class LeagueCardComponent {
  league = input.required<LeagueWithMembership>();
  enter = output<string>();
  edit = output<string>();

  badgeClass(): string {
    switch (this.league().role) {
      case 'ADMIN': return 'badge badge-default';
      case 'MEMBER': return 'badge bg-blue-500 text-white';
      case 'PENDING': return 'badge bg-amber-500 text-amber-950';
    }
  }

  onEnter(): void {
    this.enter.emit(this.league().slug);
  }

  onEdit(): void {
    this.edit.emit(this.league().slug);
  }
}
```

Create `frontend/src/app/shared/components/league-card/league-card.component.html`:

```html
<div
  class="bg-card rounded-xl border border-border p-6 transition-all"
  [class.opacity-60]="league().role === 'PENDING'"
>
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-semibold">{{ league().name }}</h3>
      <div class="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
        <span>{{ league().tournament }}</span>
        <span class="flex items-center gap-1">
          <ng-icon name="bootstrapPeople" class="text-sm" />
          {{ league().memberCount }} members
        </span>
      </div>
    </div>
    <span [class]="badgeClass()">{{ league().role }}</span>
  </div>

  <div class="mt-4">
    @if (league().role === 'PENDING') {
      <p class="text-sm text-muted-foreground italic">Awaiting owner approval</p>
    } @else {
      <div class="flex gap-2">
        <button data-action="enter" class="btn btn-default btn-sm" (click)="onEnter()">Enter</button>
        @if (league().role === 'ADMIN') {
          <button data-action="edit" class="btn btn-outline btn-sm" (click)="onEdit()">Edit</button>
        }
      </div>
    }
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/league-card/
git commit -m "feat(design-system): add LeagueCard component with role-based UI"
```

---

### Task 19: Barrel Exports & Verification

**Files:**
- Create: `frontend/src/app/shared/components/index.ts`

Create a barrel export for all shared components and run the full test suite.

- [ ] **Step 1: Create barrel export**

Create `frontend/src/app/shared/components/index.ts`:

```typescript
export {InputFieldComponent} from './input/input-field.component';
export {CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent} from './card/card.component';
export {DialogComponent, DialogHeaderComponent, DialogTitleComponent, DialogDescriptionComponent, DialogFooterComponent} from './dialog/dialog.component';
export {TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent} from './tabs/tabs.component';
export {AvatarComponent} from './avatar/avatar.component';
export {ProgressComponent} from './progress/progress.component';
export {ToastService} from './toast/toast.service';
export {ToasterComponent} from './toast/toast.component';
export {SidebarComponent, SidebarHeaderComponent, SidebarContentComponent, SidebarFooterComponent, SidebarTriggerComponent, SidebarService} from './sidebar/sidebar.component';
export {AppSidebarComponent} from './app-sidebar/app-sidebar.component';
export {DashboardLayoutComponent} from './dashboard-layout/dashboard-layout.component';
export {FooterComponent} from './footer/footer.component';
export {MatchCardComponent} from './match-card/match-card.component';
export {StatsCardsComponent} from './stats-cards/stats-cards.component';
export {RankingCardComponent} from './ranking-card/ranking-card.component';
export {TournamentStatusComponent} from './tournament-status/tournament-status.component';
export {LeagueCardComponent} from './league-card/league-card.component';
```

- [ ] **Step 2: Run full test suite**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng test --watch=false 2>&1 | tail -30`
Expected: All tests pass.

- [ ] **Step 3: Run full build**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng build --configuration=development 2>&1 | tail -10`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Run lint**

Run: `cd /Volumes/CaseSensitive/src/fantabet/frontend && npx ng lint 2>&1 | tail -10`
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/shared/components/index.ts
git commit -m "feat(design-system): add barrel exports for shared components"
```
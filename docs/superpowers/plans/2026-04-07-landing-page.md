# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the GoalCast landing page — hero, features, how-it-works, CTA, footer — as the root route.

**Architecture:** Single component (`LandingpageComponent`) with all sections in its template. No new components. Data arrays (features, steps) as component properties. All styling via existing Tailwind classes and design system tokens.

**Tech Stack:** Angular 21, Tailwind CSS v4, `@ng-icons/bootstrap-icons`, `@ng-icons/core`

**Spec:** `docs/superpowers/specs/2026-04-07-landing-page-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/app/app.routes.ts` | Remove dashboard route, add landing page as `/` |
| Modify | `frontend/src/app/features/landingpage/landingpage/landingpage.component.ts` | Add icon imports, feature/step data, component metadata |
| Modify | `frontend/src/app/features/landingpage/landingpage/landingpage.component.html` | Full landing page template (6 sections) |
| Modify | `frontend/src/app/features/landingpage/landingpage/landingpage.component.scss` | Any component-scoped styles (animation delays) |
| Modify | `frontend/src/app/features/landingpage/landingpage/landingpage.component.spec.ts` | Landing page tests |

---

### Task 1: Update Routes

**Files:**
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Update routes file**

Replace entire contents of `frontend/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '@fb/core/guards/auth.guard';
import { LoginComponent } from '@fb/features/auth/components/login/login.component';
import { RegisterComponent } from '@fb/features/auth/components/register/register.component';
import { LandingpageComponent } from '@fb/features/landingpage/landingpage/landingpage.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '', component: LandingpageComponent },
];
```

Removes dashboard route and redirect. Landing page is now root.

- [ ] **Step 2: Verify app compiles**

Run: `npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds (warnings OK, no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/app.routes.ts
git commit -m "feat: make landing page the root route, remove dashboard"
```

---

### Task 2: Landing Page Component Class

**Files:**
- Modify: `frontend/src/app/features/landingpage/landingpage/landingpage.component.ts`

- [ ] **Step 1: Update component with icons and data**

Replace entire contents of `landingpage.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    bootstrapTrophy,
    bootstrapCrosshair,
    bootstrapPeople,
    bootstrapLightning,
    bootstrapSliders,
    bootstrapShieldShaded,
    bootstrapArrowRight,
} from '@ng-icons/bootstrap-icons';

interface Feature {
    icon: string;
    title: string;
    description: string;
}

interface Step {
    number: string;
    title: string;
    description: string;
}

@Component({
    selector: 'gc-landingpage',
    imports: [RouterLink, NgIcon],
    templateUrl: './landingpage.component.html',
    styleUrl: './landingpage.component.scss',
    host: { class: 'flex flex-col' },
    viewProviders: [
        provideIcons({
            bootstrapTrophy,
            bootstrapCrosshair,
            bootstrapPeople,
            bootstrapLightning,
            bootstrapSliders,
            bootstrapShieldShaded,
            bootstrapArrowRight,
        }),
    ],
})
export class LandingpageComponent {
    features: Feature[] = [
        {
            icon: 'bootstrapCrosshair',
            title: 'Predict Results',
            description: 'Call the score for every match. See who gets it right.',
        },
        {
            icon: 'bootstrapPeople',
            title: 'Invite Friends',
            description: 'Create a league, share a link, and compete against your crew.',
        },
        {
            icon: 'bootstrapLightning',
            title: 'Bonus Predictions',
            description: 'Predict scorers and the tournament winner for extra points.',
        },
        {
            icon: 'bootstrapSliders',
            title: 'Customize Your League',
            description: 'Set prediction timeframes, enable bonus rules, and play your way.',
        },
    ];

    steps: Step[] = [
        { number: '01', title: 'Create a League', description: 'Pick a tournament, set the rules, and name your league.' },
        { number: '02', title: 'Invite Friends', description: 'Share the link or send email invites.' },
        { number: '03', title: 'Predict Scores', description: 'Submit your predictions before kickoff.' },
        { number: '04', title: 'Climb the Ranking', description: 'Earn points and see who comes out on top.' },
    ];
}
```

- [ ] **Step 2: Verify app compiles**

Run: `npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/landingpage/landingpage/landingpage.component.ts
git commit -m "feat: add landing page component class with icons and data"
```

---

### Task 3: Landing Page Template

**Files:**
- Modify: `frontend/src/app/features/landingpage/landingpage/landingpage.component.html`

- [ ] **Step 1: Write landing page template**

Replace entire contents of `landingpage.component.html`:

```html
<!-- Nav -->
<nav class="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <ng-icon name="bootstrapTrophy" class="text-accent-foreground" size="20" />
            </div>
            <span class="font-display text-xl tracking-wider">GOALCAST</span>
        </a>
        <div class="flex items-center gap-3">
            <a routerLink="/login" class="btn btn-ghost btn-sm">Log In</a>
            <a routerLink="/register" class="btn btn-gold btn-sm">Sign Up</a>
        </div>
    </div>
</nav>

<!-- Hero -->
<section class="py-24 px-6">
    <div class="max-w-4xl mx-auto text-center space-y-6">
        <div
            class="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-sm text-accent"
        >
            <ng-icon name="bootstrapShieldShaded" size="16" />
            FIFA World Cup 2026
        </div>
        <h1 class="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Create. Predict. <span class="text-gradient-gold">Compete.</span>
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Set up a league, invite your friends, predict match scores, and find out who really knows football.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a routerLink="/create-league" class="btn btn-gold btn-lg text-base">
                Create a League
                <ng-icon name="bootstrapArrowRight" size="20" />
            </a>
            <a routerLink="/login" class="btn btn-outline btn-lg text-base">Join an Existing League</a>
        </div>
    </div>
</section>

<!-- Features -->
<section class="py-20 px-6 bg-muted/30">
    <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
            <h2 class="text-3xl font-bold mb-3">What You Get</h2>
            <p class="text-muted-foreground">Everything you need to run a prediction league.</p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (feature of features; track feature.title) {
                <div
                    class="card-gradient rounded-xl border border-border p-6 space-y-3 hover:border-accent/40 transition-colors"
                >
                    <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <ng-icon [name]="feature.icon" class="text-accent" size="20" />
                    </div>
                    <h3 class="font-semibold text-lg">{{ feature.title }}</h3>
                    <p class="text-sm text-muted-foreground leading-relaxed">{{ feature.description }}</p>
                </div>
            }
        </div>
    </div>
</section>

<!-- How It Works -->
<section class="py-20 px-6">
    <div class="max-w-4xl mx-auto">
        <div class="text-center mb-14">
            <h2 class="text-3xl font-bold mb-3">How It Works</h2>
            <p class="text-muted-foreground">Get started in minutes.</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-8">
            @for (step of steps; track step.number; let i = $index) {
                <div class="flex gap-4 animate-fade-in" [style.animation-delay]="i * 100 + 'ms'">
                    <span class="font-display text-4xl text-accent/30 leading-none">{{ step.number }}</span>
                    <div>
                        <h3 class="font-semibold mb-1">{{ step.title }}</h3>
                        <p class="text-sm text-muted-foreground">{{ step.description }}</p>
                    </div>
                </div>
            }
        </div>
    </div>
</section>

<!-- CTA -->
<section class="py-20 px-6 bg-primary text-primary-foreground">
    <div class="max-w-3xl mx-auto text-center space-y-6">
        <h2 class="text-3xl font-bold">Ready?</h2>
        <p class="text-primary-foreground/70">
            Create a league in under a minute. Set rules, invite friends, start predicting.
        </p>
        <a routerLink="/create-league" class="btn btn-gold btn-lg text-base mt-4">
            Get Started
            <ng-icon name="bootstrapArrowRight" size="20" />
        </a>
    </div>
</section>

<!-- Footer -->
<footer class="bg-card border-t border-border py-8 px-6">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-muted-foreground">&copy; 2026 GoalCast</p>
        <div class="flex items-center gap-6">
            <a routerLink="/terms" class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >Terms</a
            >
            <a routerLink="/privacy" class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >Privacy</a
            >
            <a routerLink="/imprint" class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >Imprint</a
            >
        </div>
    </div>
</footer>
```

- [ ] **Step 2: Verify app compiles**

Run: `npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/landingpage/landingpage/landingpage.component.html
git commit -m "feat: add landing page template with all sections"
```

---

### Task 4: Component Styles

**Files:**
- Modify: `frontend/src/app/features/landingpage/landingpage/landingpage.component.scss`

- [ ] **Step 1: Check if animate-fade-in exists**

Run: `grep -r "animate-fade-in\|fade-in" frontend/src/styles.scss frontend/tailwind.config.* 2>/dev/null`

If it doesn't exist, add it to `landingpage.component.scss`:

```scss
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

:host {
    .animate-fade-in {
        animation: fade-in 0.5s ease-out both;
    }
}
```

If `animate-fade-in` already exists globally, leave `landingpage.component.scss` empty (or with just a `:host {}` block).

- [ ] **Step 2: Verify app compiles**

Run: `npx ng build --configuration development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/landingpage/landingpage/landingpage.component.scss
git commit -m "feat: add fade-in animation for landing page steps"
```

---

### Task 5: Tests

**Files:**
- Modify: `frontend/src/app/features/landingpage/landingpage/landingpage.component.spec.ts`

- [ ] **Step 1: Write landing page tests**

Replace entire contents of `landingpage.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingpageComponent } from './landingpage.component';

describe('LandingpageComponent', () => {
    let fixture: ComponentFixture<LandingpageComponent>;
    let compiled: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LandingpageComponent],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(LandingpageComponent);
        fixture.detectChanges();
        compiled = fixture.nativeElement as HTMLElement;
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render nav with GOALCAST branding', () => {
        const nav = compiled.querySelector('nav');
        expect(nav).toBeTruthy();
        expect(nav!.textContent).toContain('GOALCAST');
    });

    it('should render login and register links in nav', () => {
        const nav = compiled.querySelector('nav')!;
        const links = nav.querySelectorAll('a');
        const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('/login');
        expect(hrefs).toContain('/register');
    });

    it('should render hero headline', () => {
        const h1 = compiled.querySelector('h1');
        expect(h1).toBeTruthy();
        expect(h1!.textContent).toContain('Create. Predict.');
        expect(h1!.textContent).toContain('Compete.');
    });

    it('should render 4 feature cards', () => {
        const featureSection = compiled.querySelectorAll('.card-gradient');
        expect(featureSection.length).toBe(4);
    });

    it('should render feature titles', () => {
        const titles = Array.from(compiled.querySelectorAll('.card-gradient h3')).map((el) => el.textContent?.trim());
        expect(titles).toEqual(['Predict Results', 'Invite Friends', 'Bonus Predictions', 'Customize Your League']);
    });

    it('should render 4 how-it-works steps', () => {
        const steps = compiled.querySelectorAll('.animate-fade-in');
        expect(steps.length).toBe(4);
    });

    it('should render CTA section with Ready headline', () => {
        const cta = compiled.querySelector('.bg-primary h2');
        expect(cta).toBeTruthy();
        expect(cta!.textContent).toContain('Ready?');
    });

    it('should render footer with copyright and legal links', () => {
        const footer = compiled.querySelector('footer');
        expect(footer).toBeTruthy();
        expect(footer!.textContent).toContain('2026 GoalCast');

        const footerLinks = Array.from(footer!.querySelectorAll('a')).map((a) => a.getAttribute('href'));
        expect(footerLinks).toContain('/terms');
        expect(footerLinks).toContain('/privacy');
        expect(footerLinks).toContain('/imprint');
    });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --reporter=verbose frontend/src/app/features/landingpage/landingpage/landingpage.component.spec.ts 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/landingpage/landingpage/landingpage.component.spec.ts
git commit -m "test: add landing page component tests"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run full build**

Run: `npx ng build --configuration development 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 2: Run all tests**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass, no regressions

- [ ] **Step 3: Visual check**

Run: `npx ng serve` and open `http://localhost:4200/` in browser.
Verify: Nav, Hero, Features (4 cards), How It Works (4 steps), CTA, Footer all render correctly.
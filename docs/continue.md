# GoalCast — Pending Issues & Next Steps

## 1. `*` border-color reset overrides Tailwind utility classes

### Problem
The `*` reset in `styles.scss` sets `border-color: hsl(var(--border))` on every element. This rule appears after Tailwind's utility layer in the final CSS output, so it overrides utility classes like `border-destructive`, `border-accent`, `border-success`, etc. The inline `[style.border-color]` workaround currently used on the input component works but defeats the purpose of having Tailwind color utilities.

### Root Cause
In Tailwind v4, `@import "tailwindcss"` controls the layer order. Plain CSS rules written after the import (like the `*` reset) end up in a higher-priority layer than Tailwind's utilities, so they always win regardless of specificity.

### Options

**Option A — Remove the `*` reset entirely**
- Remove `* { border-color: hsl(var(--border)); }` from `styles.scss`
- Rely on explicitly adding `border-input` or `border-border` on elements that need a themed border
- Pro: Clean, no conflicts with any Tailwind border utility
- Con: Need to add `border-input` manually wherever a default border color is wanted

**Option B — Wrap in `@layer base`**
- Wrap the reset in `@layer base { * { border-color: hsl(var(--border)); } }`
- Tailwind v4's layer order: `base < theme < utilities`, so utilities will win
- Pro: Keeps the default border behavior, utilities override cleanly
- Con: Needs verification that `@layer base` works correctly within Tailwind v4's CSS layer system

**Option C — Use lower specificity with `:where()`**
- Change to `:where(*) { border-color: hsl(var(--border)); }` which has zero specificity
- Any class-based rule will override it
- Pro: Simplest change, keeps the reset, guaranteed to lose against any utility
- Con: Unusual pattern, may confuse future contributors

### Recommendation
Option C (`:where(*)`) is the least disruptive single-line change. Option A is the cleanest long-term.

---

## 2. SVG icon rendering via `[innerHTML]`

### Problem
`@ng-icons/heroicons` exports icons as raw SVG strings. Angular's `[innerHTML]` sanitizer strips SVG elements, so icons don't render.

### Current Workaround
Using `DomSanitizer.bypassSecurityTrustHtml()` to mark the SVG string as trusted. This is safe because the SVG comes from a static trusted package (`@ng-icons/heroicons`), not from user input.

### Alternative
Use `@ng-icons/core`'s `<ng-icon>` component with `provideIcons()` (already set up in the component via `viewProviders`). This avoids manual sanitization entirely — the `NgIcon` component handles SVG rendering internally. The template would use:
```html
<ng-icon name="heroExclamationCircle" class="text-destructive" size="20" />
```
instead of the `[innerHTML]` span.

---

## 3. Input component — remove unused code

### Items to clean up
- `DomSanitizer` inject can be removed if switching to `<ng-icon>` component
- `heroExclamationCircle` field on the class can be removed if using `<ng-icon>`
- The `[style.border-color]` inline workaround can be removed once the `*` reset issue (item 1) is resolved
- `[class.border-input]` toggle can be removed if the `*` reset is removed (just add `border-input` to the static class list as default)
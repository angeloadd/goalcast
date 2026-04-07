import { Component, inject, InjectionToken, input, model, OnInit, signal } from '@angular/core';

const TOGGLE_GROUP_CONTEXT = new InjectionToken<ToggleGroupContext>('ToggleGroupContext');

export class ToggleGroupContext {
    type = signal<'single' | 'multiple'>('single');
    selectedValues = signal<string[]>([]);

    private onChange: (value: string | string[]) => void = () => {
        /* noop */
    };

    registerOnChange(fn: (value: string | string[]) => void): void {
        this.onChange = fn;
    }

    toggle(value: string): void {
        if (this.type() === 'single') {
            this.selectedValues.set([value]);
            this.onChange(value);
        } else {
            this.selectedValues.update((vals) =>
                vals.includes(value) ? vals.filter((v) => v !== value) : [...vals, value],
            );
            this.onChange(this.selectedValues());
        }
    }

    isSelected(value: string): boolean {
        return this.selectedValues().includes(value);
    }
}

@Component({
    selector: 'gc-toggle',
    templateUrl: './toggle.component.html',
})
export class ToggleComponent {
    pressed = model(false);

    onToggle(): void {
        this.pressed.set(!this.pressed());
    }
}

@Component({
    selector: 'gc-toggle-group',
    host: { class: 'inline-flex items-center gap-1' },
    template: '<ng-content />',
    providers: [{ provide: TOGGLE_GROUP_CONTEXT, useFactory: () => new ToggleGroupContext() }],
})
export class ToggleGroupComponent implements OnInit {
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
    selector: 'gc-toggle-group-item',
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

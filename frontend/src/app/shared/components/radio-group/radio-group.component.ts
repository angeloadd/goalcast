import { Component, computed, forwardRef, inject, InjectionToken, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export class RadioGroupContext {
    selectedValue = signal<string>('');
    private onChange: (value: string) => void = () => {
    };

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    select(value: string): void {
        this.selectedValue.set(value);
        this.onChange(value);
    }
}

const RADIO_GROUP_CONTEXT = new InjectionToken<RadioGroupContext>('RadioGroupContext');

@Component({
    selector: 'fb-radio-group',
    templateUrl: './radio-group.component.html',
    providers: [
        { provide: RADIO_GROUP_CONTEXT, useFactory: () => new RadioGroupContext() },
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RadioGroupComponent),
            multi: true,
        },
    ],
})
export class RadioGroupComponent implements ControlValueAccessor {
    private context = inject(RADIO_GROUP_CONTEXT);
    private onTouched: () => void = () => {
    };

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
    host: { class: 'block' },
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

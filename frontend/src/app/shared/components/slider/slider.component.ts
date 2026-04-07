import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'fb-slider',
    templateUrl: './slider.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SliderComponent),
            multi: true,
        },
    ],
})
export class SliderComponent implements ControlValueAccessor {
    min = input(0);
    max = input(100);
    step = input(1);
    value = signal(0);
    isDisabled = signal(false);

    private onChange: (value: number) => void = () => {
        /* noop */
    };
    onTouched: () => void = () => {
        /* noop */
    };

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

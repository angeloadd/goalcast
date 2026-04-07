import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'gc-switch',
    templateUrl: './switch.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true,
        },
    ],
})
export class SwitchComponent implements ControlValueAccessor {
    checked = signal(false);
    isDisabled = signal(false);

    private onChange: (value: boolean) => void = () => {
        /* noop */
    };
    private onTouched: () => void = () => {
        /* noop */
    };

    writeValue(value: boolean): void {
        this.checked.set(value);
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
        if (this.isDisabled()) {
            return;
        }
        const newValue = !this.checked();
        this.checked.set(newValue);
        this.onChange(newValue);
        this.onTouched();
    }
}

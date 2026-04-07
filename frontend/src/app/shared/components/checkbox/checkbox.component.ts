import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'fb-checkbox',
    templateUrl: './checkbox.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CheckboxComponent),
            multi: true,
        },
    ],
})
export class CheckboxComponent implements ControlValueAccessor {
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

    onToggle(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.checked.set(checked);
        this.onChange(checked);
        this.onTouched();
    }
}

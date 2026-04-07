import {
    Component,
    computed,
    ElementRef,
    forwardRef,
    input,
    signal,
    viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'fb-input-otp',
    template: `
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
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputOtpComponent),
            multi: true,
        },
    ],
})
export class InputOtpComponent implements ControlValueAccessor {
    length = input(6);
    slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
    values = signal<string[]>([]);
    isDisabled = signal(false);
    private otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

    private onChange: (value: string) => void = () => {
        /* noop */
    };
    private onTouched: () => void = () => {
        /* noop */
    };

    writeValue(value: string): void {
        const chars = (value ?? '').split('').slice(0, this.length());
        this.values.set(Array.from({ length: this.length() }, (_, i) => chars[i] ?? ''));
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
        const char = (event.target as HTMLInputElement).value.slice(-1);
        this.values.update((v) => {
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
            this.values.update((v) => {
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
        const chars = (event.clipboardData?.getData('text') ?? '')
            .split('')
            .slice(0, this.length());
        this.values.set(
            Array.from({ length: this.length() }, (_, i) => chars[i] ?? this.values()[i] ?? ''),
        );
        this.emitValue();
    }

    private focusAt(index: number): void {
        const inputs = this.otpInputs();
        if (inputs[index]) {
            inputs[index].nativeElement.focus();
        }
    }

    private emitValue(): void {
        this.onChange(this.values().join(''));
        this.onTouched();
    }
}

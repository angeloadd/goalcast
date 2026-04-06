import { Component, computed, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { merge, switchMap } from 'rxjs';

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

    private controlEvent = toSignal(
        toObservable(this.control).pipe(
            switchMap((c) => (c ? merge(c.statusChanges, c.valueChanges, c.events) : [])),
        ),
        { initialValue: null },
    );

    errorMessage = computed(() => {
        this.controlEvent();
        const ctrl = this.control();
        if (!ctrl || !ctrl.errors || !ctrl.touched) {
            return null;
        }
        const firstKey = Object.keys(ctrl.errors)[0];
        const messageFn = ERROR_MESSAGES[firstKey];
        return messageFn ? messageFn(ctrl.errors[firstKey]) : 'Invalid value';
    });
}

import { Component, computed, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { merge, switchMap } from 'rxjs';
import { getFirstError } from '@fb/shared/utils/form-errors';

@Component({
    selector: 'gc-form-group',
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
        if (!ctrl || !ctrl.touched) {
            return null;
        }
        return getFirstError(ctrl.errors);
    });
}

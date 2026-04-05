import {Component, computed, input, Signal} from '@angular/core';
import {FormControl, FormControlStatus, ReactiveFormsModule} from '@angular/forms';
import {bootstrapExclamationCircle} from '@ng-icons/bootstrap-icons';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {NgClass} from '@angular/common';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';

const ERROR_MESSAGES: Record<string, (params?: any) => string> = {
  required: () => 'This field is required',
  email: () => 'Please enter a valid email',
  minlength: (p) => `Minimum ${p.requiredLength} characters`,
  maxlength: (p) => `Maximum ${p.requiredLength} characters`,
  pattern: () => 'Invalid format',
};

@Component({
  selector: 'fb-input-field',
  templateUrl: './input-field.component.html',
  imports: [ReactiveFormsModule, NgIcon, NgClass],
  viewProviders: [provideIcons({bootstrapExclamationCircle})]
})
export class InputFieldComponent {
  control = input.required<FormControl>();
  status: Signal<FormControlStatus> = toSignal(
    toObservable(this.control).pipe(switchMap(c => c.statusChanges)),
    {initialValue: 'VALID'}
  );
  error = computed(() => {
    this.status();
    const ctrl = this.control();
    if (!ctrl.errors || !ctrl.touched) {
      return null;
    }
    const firstKey = Object.keys(ctrl.errors)[0];
    const messageFn = ERROR_MESSAGES[firstKey];
    return messageFn ? messageFn(ctrl.errors[firstKey]) : 'Invalid value';
  });
  inputId = input.required<string>();
  label = input.required<string>();
  type = input.required<'text' | 'password' | 'email' | 'number'>();
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  autocomplete = computed<string>(() => this.type() === 'password' ? 'off' : 'on');
}

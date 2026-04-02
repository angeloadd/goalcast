import {Component, computed, input} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {heroExclamationCircle} from '@ng-icons/heroicons/outline';
import {NgIcon, provideIcons} from '@ng-icons/core';

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
  imports: [ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({heroExclamationCircle})]
})
export class InputFieldComponent {
  control = input.required<FormControl>()
  inputId = input.required<string>()
  label = input.required<string>()
  type = input.required<'text' | 'password' | 'email' | 'number'>()
  placeholder = input<string | undefined>(undefined)
  required = input<boolean>(false)
  autocomplete = computed<string>(() => this.type() === 'password' ? 'off' : 'on')

  get error(): string | null {
    const ctrl = this.control();
    if (!ctrl.errors || !ctrl.touched) {
      return null;
    }
    const firstKey = Object.keys(ctrl.errors)[0];
    const messageFn = ERROR_MESSAGES[firstKey];
    return messageFn ? messageFn(ctrl.errors[firstKey]) : 'Invalid value';
  }

  hasError(): boolean {
    return !!this.error;
  }
}

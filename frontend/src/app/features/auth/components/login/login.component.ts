import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {userLoginStarted} from '@fb/core/auth/auth.actions';
import {selectAuthError, selectAuthLoading} from '@fb/core/auth/auth.selectors';
import {InputFieldComponent} from '@fb/shared/components/input/input-field.component';

@Component({
  selector: 'fb-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputFieldComponent],
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.scss',
})
export class LoginComponent {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  controls = {
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  };

  form = new FormGroup(this.controls);

  onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {email, password} = this.form.value;
    if (email && password) {
      this.store.dispatch(userLoginStarted({email, password}));
    }
  }
}

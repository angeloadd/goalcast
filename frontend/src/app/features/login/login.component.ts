import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {AuthActions} from '../../core/auth/auth.actions';
import {selectAuthError, selectAuthLoading} from '../../core/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
        <form [formGroup]="form" (ngSubmit)="onLogin()">
            <input formControlName="username" placeholder="Username" />
            <input formControlName="password" type="password" placeholder="Password" />
            <button type="submit" [disabled]="loading()">Login</button>
            @if (error()) {
                <p class="error">{{ error() }}</p>
            }
        </form>
    `,
})
export class LoginComponent {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  onLogin(): void {
    const {username, password} = this.form.value;
    if (username && password) {
      this.store.dispatch(AuthActions.login({username, password}));
    }
  }
}

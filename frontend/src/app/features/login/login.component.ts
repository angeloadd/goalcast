import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {userLoginStarted} from '@fb/core/auth/auth.actions';
import {selectAuthError, selectAuthLoading} from '@fb/core/auth/auth.selectors';

@Component({
  selector: 'fb-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: 'login.component.html',
  styleUrl: 'login.component.scss',
})
export class LoginComponent {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  onLogin(): void {
    const {email, password} = this.form.value;
    if (email && password) {
      this.store.dispatch(userLoginStarted({email, password}));
    }
  }
}

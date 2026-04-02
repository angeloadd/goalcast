import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {userRegistrationStarted} from '@fb/core/state/auth/auth.actions';
import {selectAuthError, selectAuthLoading} from '@fb/core/state/auth/auth.selectors';

@Component({
  selector: 'fb-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: 'register.component.html',
  styleUrl: 'register.component.scss',
})
export class RegisterComponent {
  private store = inject(Store);

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  form = new FormGroup({
    username: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')]),
  });

  onRegister(): void {
    const {username, email, password} = this.form.value;
    if (username && email && password) {
      this.store.dispatch(userRegistrationStarted({username, email, password}));
    }
  }
}

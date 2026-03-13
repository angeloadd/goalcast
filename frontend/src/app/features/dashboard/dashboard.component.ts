import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser, selectIsLoggedIn} from '@fb/core/auth/auth.selectors';
import {LoginComponent} from '@fb/features/login/login.component';
import {RegisterComponent} from '@fb/features/register/register.component';
import {userLogoutStarted} from '@fb/core/auth/auth.actions';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: 'dashboard.component.html',
  styleUrl: 'dashboard.component.scss',
  imports: [
    LoginComponent,
    RegisterComponent
  ]
})
export class DashboardComponent {
  private store = inject(Store);

  user = this.store.selectSignal(selectCurrentUser);
  isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  onLogout(): void {
    this.store.dispatch(userLogoutStarted());
  }
}

import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser, selectIsLoggedIn} from '@fb/core/state/auth/auth.selectors';
import {userLogoutStarted} from '@fb/core/state/auth/auth.actions';
import {LoginComponent} from '@fb/features/auth/components/login/login.component';
import {RegisterComponent} from '@fb/features/auth/components/register/register.component';

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

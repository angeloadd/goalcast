import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {AuthActions} from '../../core/auth/auth.actions';
import {selectCurrentUser, selectIsLoggedIn} from '../../core/auth/auth.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
        @if (isLoggedIn()) {
            <h1>Welcome, {{ user()?.username }}</h1>
            <button (click)="onLogout()">Logout</button>
        }
    `,
})
export class DashboardComponent {
  private store = inject(Store);

  user = this.store.selectSignal(selectCurrentUser);
  isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  onLogout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

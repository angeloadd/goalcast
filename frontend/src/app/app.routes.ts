import {Routes} from '@angular/router';
import {authGuard} from '@fb/core/auth/auth.guard';
import {DashboardComponent} from '@fb/features/dashboard/dashboard.component';
import {LoginComponent} from '@fb/features/login/login.component';

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
];

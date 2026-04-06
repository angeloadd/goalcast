import { Routes } from '@angular/router';
import { authGuard } from '@fb/core/guards/auth.guard';
import { LoginComponent } from '@fb/features/auth/components/login/login.component';
import { RegisterComponent } from '@fb/features/auth/components/register/register.component';
import { DashboardComponent } from '@fb/features/dashboard/components/dashboard/dashboard.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];

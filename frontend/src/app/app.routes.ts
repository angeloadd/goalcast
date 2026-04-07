import { Routes } from '@angular/router';
import { authGuard } from '@fb/core/guards/auth.guard';
import { LoginComponent } from '@fb/features/auth/components/login/login.component';
import { RegisterComponent } from '@fb/features/auth/components/register/register.component';
import { LandingpageComponent } from '@fb/features/landingpage/landingpage/landingpage.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '', component: LandingpageComponent },
];

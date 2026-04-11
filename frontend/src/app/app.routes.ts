import { Routes } from '@angular/router';
import { LoginComponent } from '@fb/features/login/login.component';
import { RegisterComponent } from '@fb/features/register/register.component';
import { LandingpageComponent } from '@fb/features/landingpage/landingpage.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: '', component: LandingpageComponent },
];

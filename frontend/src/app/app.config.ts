import {
    ApplicationConfig,
    isDevMode,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from '@fb/app.routes';
import { authReducer } from '@fb/core/state/auth/auth.reducer';
import { AuthEffects } from '@fb/core/state/auth/auth.effects';
import { authInterceptor } from '@fb/core/interceptors/auth.interceptor';
import { initUser } from '@fb/core/initializer/initUser';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideStore({ auth: authReducer }),
        provideEffects([AuthEffects]),
        ...(isDevMode() ? [provideStoreDevtools({ maxAge: 25 })] : []),
        provideAppInitializer(initUser),
    ],
};

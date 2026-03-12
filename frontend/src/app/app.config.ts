import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideStore, Store} from '@ngrx/store';
import {Actions, ofType, provideEffects} from '@ngrx/effects';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {firstValueFrom, take} from 'rxjs';

import {routes} from './app.routes';
import {authReducer} from './core/auth/auth.reducer';
import {AuthEffects} from './core/auth/auth.effects';
import {AuthActions} from './core/auth/auth.actions';
import {authInterceptor} from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({auth: authReducer}),
    provideEffects(AuthEffects),
    ...(isDevMode() ? [provideStoreDevtools({maxAge: 25})] : []),
    provideAppInitializer(() => {
      const store = inject(Store);
      const actions$ = inject(Actions);

      store.dispatch(AuthActions.checkSession());
      return firstValueFrom(
        actions$.pipe(
          ofType(AuthActions.checkSessionSuccess, AuthActions.checkSessionFailure),
          take(1),
        ),
      );
    }),
  ],
};

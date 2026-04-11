import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthApiService } from '@fb/core/repository/auth-api.service';
import {
    userLoginFailed,
    userLoginStarted,
    userLoginSucceeded,
    userLogoutStarted,
    userLogoutSucceeded,
    userRegistrationFailed,
    userRegistrationStarted,
    userRegistrationSucceeded,
    userSessionCheckFailed,
    userSessionCheckStarted,
    userSessionCheckSucceeded,
} from '@fb/core/state/auth/auth.actions';

@Injectable()
export class AuthEffects {
    private actions$ = inject(Actions);
    private authApi = inject(AuthApiService);
    private router = inject(Router);

    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(userLoginStarted),
            switchMap(({ email, password }) =>
                this.authApi.login(email, password).pipe(
                    map((user) => userLoginSucceeded({ user })),
                    catchError((error) => of(userLoginFailed({ error }))),
                ),
            ),
        ),
    );

    loginSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userLoginSucceeded),
                tap(() => this.router.navigate(['/dashboard'])),
            ),
        { dispatch: false },
    );

    logout$ = createEffect(() =>
        this.actions$.pipe(
            ofType(userLogoutStarted),
            switchMap(() =>
                this.authApi.logout().pipe(
                    map(() => userLogoutSucceeded()),
                    catchError(() => of(userLoginFailed)),
                ),
            ),
        ),
    );

    logoutSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userLogoutSucceeded),
                tap(() => this.router.navigate(['/login'])),
            ),
        { dispatch: false },
    );

    checkSession$ = createEffect(() =>
        this.actions$.pipe(
            ofType(userSessionCheckStarted),
            switchMap(() =>
                this.authApi.getCurrentUser().pipe(
                    map((user) => userSessionCheckSucceeded({ user })),
                    catchError(() => of(userSessionCheckFailed())),
                ),
            ),
        ),
    );

    register$ = createEffect(() =>
        this.actions$.pipe(
            ofType(userRegistrationStarted),
            switchMap(({ username, email, password }) =>
                this.authApi.registerUser(username, email, password).pipe(
                    map((user) => userRegistrationSucceeded({ user })),
                    catchError((error) => of(userRegistrationFailed({ error }))),
                ),
            ),
        ),
    );

    registerSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(userRegistrationSucceeded),
                tap(() => this.router.navigate(['/login'])),
            ),
        { dispatch: false },
    );
}

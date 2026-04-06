import { createAction, props } from '@ngrx/store';
import { User } from '@fb/shared/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

export const userRegistrationStarted = createAction(
    '[Auth] User Registration Started',
    props<{
        username: string;
        email: string;
        password: string;
    }>(),
);
export const userRegistrationSucceeded = createAction(
    '[Auth] User Registration Succeeded',
    props<{ user: User }>(),
);
export const userRegistrationFailed = createAction(
    '[Auth] User Registration Failed',
    props<{
        error: HttpErrorResponse;
    }>(),
);

export const userLoginStarted = createAction(
    '[Auth] User Login Started',
    props<{ email: string; password: string }>(),
);
export const userLoginFailed = createAction(
    '[Auth] User Login Failed',
    props<{ error: HttpErrorResponse }>(),
);
export const userLoginSucceeded = createAction(
    '[Auth] User Login Succeeded',
    props<{ user: User }>(),
);

export const userLogoutStarted = createAction('[Auth] User Logout Started');
export const userLogoutSucceeded = createAction('[Auth] User Logout Succeeded');
export const userLogoutFailed = createAction('[Auth] User Logout Failed');

export const userSessionCheckStarted = createAction('[Auth] User Session Check Started');
export const userSessionCheckSucceeded = createAction(
    '[Auth] User Session Check Succeeded',
    props<{ user: User }>(),
);
export const userSessionCheckFailed = createAction('[Auth] User Session Check Failed');

export const userAuthErrorCleared = createAction('[Auth] Auth Error Cleared');

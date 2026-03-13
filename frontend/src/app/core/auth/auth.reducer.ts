import {createReducer, on} from '@ngrx/store';
import {User} from '@fb/shared/models/user.model';
import {
  userAuthErrorCleared,
  userLoginFailed,
  userLoginStarted,
  userLoginSucceeded,
  userLogoutFailed,
  userLogoutSucceeded,
  userRegistrationStarted,
  userSessionCheckFailed,
  userSessionCheckStarted,
  userSessionCheckSucceeded
} from '@fb/core/auth/auth.actions';
import {HttpErrorResponse} from '@angular/common/http';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: HttpErrorResponse | null;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  on(userLoginStarted, userRegistrationStarted, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(userLoginSucceeded, (state, {user}) => ({
    ...state,
    user,
    loading: false,
  })),

  on(userLoginFailed, (state, {error}) => ({
    ...state,
    loading: false,
    error,
  })),

  on(userLoginStarted, (state) => ({
    ...state,
    loading: true,
  })),

  on(userLogoutSucceeded, userLogoutFailed, () => ({
    ...initialAuthState,
  })),

  on(userSessionCheckStarted, (state) => ({
    ...state,
    loading: true,
  })),

  on(userSessionCheckSucceeded, (state, {user}) => ({
    ...state,
    user,
    loading: false,
  })),

  on(userSessionCheckFailed, (state) => ({
    ...state,
    user: null,
    loading: false,
  })),

  on(userAuthErrorCleared, (state) => ({
    ...state,
    error: null,
  })),
);

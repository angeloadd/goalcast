import {createReducer, on} from '@ngrx/store';
import {User} from '../../shared/models/user.model';
import {AuthActions} from './auth.actions';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, {user}) => ({
    ...state,
    user,
    loading: false,
  })),

  on(AuthActions.loginFailure, (state, {error}) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
  })),

  on(AuthActions.checkSession, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.checkSessionSuccess, (state, {user}) => ({
    ...state,
    user,
    loading: false,
  })),

  on(AuthActions.checkSessionFailure, (state) => ({
    ...state,
    user: null,
    loading: false,
  })),

  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
);

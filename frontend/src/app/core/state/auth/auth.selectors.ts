import {createFeatureSelector, createSelector} from '@ngrx/store';
import {AuthState} from '@fb/core/state/auth/auth.reducer';

const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);
export const selectIsLoggedIn = createSelector(selectAuthState, (state) => state.user !== null);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => {
  console.log(state.error)
  return state.error?.error.message;
});

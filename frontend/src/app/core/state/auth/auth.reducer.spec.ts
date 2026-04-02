import {authReducer, initialAuthState} from './auth.reducer';
import {
  userAuthErrorCleared,
  userLoginFailed,
  userLoginStarted,
  userLoginSucceeded,
  userLogoutSucceeded,
  userSessionCheckFailed,
  userSessionCheckSucceeded,
} from './auth.actions';
import {HttpErrorResponse} from '@angular/common/http';

describe('authReducer', () => {
  it('should set loading on login', () => {
    const state = authReducer(
      initialAuthState,
      userLoginStarted({email: 'test@test.com', password: 'pass'}),
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set user on login success', () => {
    const user = {username: 'cicciofrizzo', email: "ciao@example.com", roles: ['ROLE_USER']};
    const state = authReducer(initialAuthState, userLoginSucceeded({user}));
    expect(state.user).toEqual(user);
    expect(state.loading).toBe(false);
  });

  it('should set error on login failure', () => {
    const error = new HttpErrorResponse({status: 401, statusText: 'Invalid credentials'});
    const state = authReducer(
      initialAuthState,
      userLoginFailed({error}),
    );
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
    expect(state.user).toBeNull();
  });

  it('should reset state on logout success', () => {
    const loggedInState = {
      user: {username: 'cicciofrizzo', email: "ciao@example.com", roles: ['ROLE_USER']},
      loading: false,
      error: null,
    };
    const state = authReducer(loggedInState, userLogoutSucceeded());
    expect(state).toEqual(initialAuthState);
  });

  it('should set user on check session success', () => {
    const user = {username: 'cicciofrizzo', email: "ciao@example.com", roles: ['ROLE_USER']};
    const state = authReducer(initialAuthState, userSessionCheckSucceeded({user}));
    expect(state.user).toEqual(user);
    expect(state.loading).toBe(false);
  });

  it('should clear user on check session failure', () => {
    const state = authReducer(initialAuthState, userSessionCheckFailed());
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should clear error', () => {
    const error = new HttpErrorResponse({status: 500});
    const errorState = {...initialAuthState, error};
    const state = authReducer(errorState, userAuthErrorCleared());
    expect(state.error).toBeNull();
  });
});

import { AuthActions } from './auth.actions';
import { authReducer, initialAuthState } from './auth.reducer';

describe('authReducer', () => {
    it('should set loading on login', () => {
        const state = authReducer(
            initialAuthState,
            AuthActions.login({ username: 'test', password: 'pass' }),
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
    });

    it('should set user on login success', () => {
        const user = { username: 'cicciofrizzo', roles: ['ROLE_USER'] };
        const state = authReducer(initialAuthState, AuthActions.loginSuccess({ user }));
        expect(state.user).toEqual(user);
        expect(state.loading).toBe(false);
    });

    it('should set error on login failure', () => {
        const state = authReducer(
            initialAuthState,
            AuthActions.loginFailure({ error: 'Invalid credentials' }),
        );
        expect(state.error).toBe('Invalid credentials');
        expect(state.loading).toBe(false);
        expect(state.user).toBeNull();
    });

    it('should reset state on logout success', () => {
        const loggedInState = {
            user: { username: 'cicciofrizzo', roles: ['ROLE_USER'] },
            loading: false,
            error: null,
        };
        const state = authReducer(loggedInState, AuthActions.logoutSuccess());
        expect(state).toEqual(initialAuthState);
    });

    it('should set user on check session success', () => {
        const user = { username: 'cicciofrizzo', roles: ['ROLE_USER'] };
        const state = authReducer(initialAuthState, AuthActions.checkSessionSuccess({ user }));
        expect(state.user).toEqual(user);
        expect(state.loading).toBe(false);
    });

    it('should clear user on check session failure', () => {
        const state = authReducer(initialAuthState, AuthActions.checkSessionFailure());
        expect(state.user).toBeNull();
        expect(state.loading).toBe(false);
    });

    it('should clear error', () => {
        const errorState = { ...initialAuthState, error: 'some error' };
        const state = authReducer(errorState, AuthActions.clearError());
        expect(state.error).toBeNull();
    });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { authGuard } from './auth.guard';
import { selectIsLoggedIn } from './auth.selectors';

describe('authGuard', () => {
    let store: MockStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideMockStore({
                    selectors: [{ selector: selectIsLoggedIn, value: false }],
                }),
                { provide: Router, useValue: { createUrlTree: vi.fn(() => '/login') } },
            ],
        });
        store = TestBed.inject(MockStore);
    });

    it('should redirect to /login when not logged in', () => {
        const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
        expect(result).toBe('/login');
    });

    it('should allow access when logged in', () => {
        store.overrideSelector(selectIsLoggedIn, true);
        store.refreshState();
        const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
        expect(result).toBe(true);
    });
});

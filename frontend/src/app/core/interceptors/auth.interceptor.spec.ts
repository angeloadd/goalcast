import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {authInterceptor} from './auth.interceptor';
import {userLogoutStarted} from '../state/auth/auth.actions';

describe('authInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let store: MockStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                provideMockStore(),
            ],
        });
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        store = TestBed.inject(MockStore);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should add withCredentials to requests', () => {
        http.get('/api/test').subscribe();
        const req = httpMock.expectOne('/api/test');
        expect(req.request.withCredentials).toBe(true);
        req.flush({});
    });

    it('should dispatch logout on 401 for non-login requests', () => {
        const dispatchSpy = vi.spyOn(store, 'dispatch');
        http.get('/api/auth/me').subscribe({ error: () => undefined });
        const req = httpMock.expectOne('/api/auth/me');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(dispatchSpy).toHaveBeenCalledWith(userLogoutStarted());
    });

    it('should not dispatch logout on 401 for login requests', () => {
        const dispatchSpy = vi.spyOn(store, 'dispatch');
        http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
        const req = httpMock.expectOne('/api/auth/login');
        req.flush({}, { status: 401, statusText: 'Unauthorized' });
        expect(dispatchSpy).not.toHaveBeenCalled();
    });
});

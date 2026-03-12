import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {catchError, throwError} from 'rxjs';
import {AuthActions} from './auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  const authReq = req.clone({withCredentials: true});
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        store.dispatch(AuthActions.logout());
      }
      return throwError(() => error);
    }),
  );
};

import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {selectIsLoggedIn} from './auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  if (store.selectSignal(selectIsLoggedIn)()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

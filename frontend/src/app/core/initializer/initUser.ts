import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { firstValueFrom, take } from 'rxjs';
import {
    userSessionCheckFailed,
    userSessionCheckStarted,
    userSessionCheckSucceeded,
} from '@fb/core/state/auth/auth.actions';

export const initUser = () => {
    const store = inject(Store);
    const actions$ = inject(Actions);

    store.dispatch(userSessionCheckStarted());

    return firstValueFrom(
        actions$.pipe(ofType(userSessionCheckSucceeded, userSessionCheckFailed), take(1)),
    );
};

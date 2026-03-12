import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {User} from '../../shared/models/user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ username: string; password: string }>(),
    'Login Success': props<{ user: User }>(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),

    'Check Session': emptyProps(),
    'Check Session Success': props<{ user: User }>(),
    'Check Session Failure': emptyProps(),

    'Clear Error': emptyProps(),
  },
});

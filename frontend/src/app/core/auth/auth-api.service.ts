import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../shared/models/user.model';

@Injectable({providedIn: 'root'})
export class AuthApiService {
  private http = inject(HttpClient);

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/login', {username, password});
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/auth/me');
  }
}

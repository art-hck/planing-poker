import { Injectable } from '@angular/core';
import { map, Observable, ReplaySubject, Subject, withLatestFrom } from "rxjs";
import { Handshake, User } from "@common/models";
import { Select } from "@ngxs/store";
import { UsersState } from "../../states/users.state";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  @Select(UsersState.users) users$!: Observable<User[]>;
  readonly beforeLogout$ = new Subject<void>();
  readonly logout$ = new Subject<void>();
  readonly login$ = new ReplaySubject<Handshake>(1);
  readonly user$ = new ReplaySubject<User | null>(1);
  readonly isAdmin$ = this.users$.pipe(
    withLatestFrom(this.user$),
    map(([users, user]) => user?.role === 'admin' || users.find(({ id }) => id === user?.id)?.role === 'admin')
  );
  loginAttempts = 0;

  constructor() {
    this.logout$.subscribe(() => {
      this.beforeLogout$.next();
      window.localStorage.removeItem('token');
      this.user$.next(null);
    });
  }
}

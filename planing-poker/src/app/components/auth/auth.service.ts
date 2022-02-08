import { Injectable } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { AuthComponent } from "./auth.component";
import { map, of, ReplaySubject, startWith, Subject, switchMap } from "rxjs";
import { Handshake, User } from "@common/models";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly beforeLogout$ = new Subject<void>();
  readonly logout$ = new Subject<void>();
  readonly login$ = new ReplaySubject<Handshake>(1);
  readonly user$ = new ReplaySubject<User | null>();
  readonly isAdmin$ = this.user$.pipe(map(user => user?.role === 'admin'));
  loginAttempts = 0;

  constructor(public dialog: MatDialog) {
    this.logout$.subscribe(() => {
      this.beforeLogout$.next();
      window.localStorage.removeItem('token');
      this.user$.next(null);
    })

    this.logout$.pipe(
      startWith(null),
      switchMap(() => {
        const token = window.localStorage.getItem('token');
        const config = { disableClose: true, data: { loginAttempts: this.loginAttempts } };
        return token ? of({ token }) : this.dialog.open(AuthComponent, config).afterClosed()
      }),
    ).subscribe((user: Handshake) => this.login$.next(user))
  }
}

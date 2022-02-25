import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanActivate } from '@angular/router';
import { filter, mapTo, of, startWith, switchMap, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AuthComponent } from './auth.component';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
  ) {
    this.authService.logout$.pipe(
      startWith(null),
      switchMap(() => {
        const token = window.localStorage.getItem('token');
        const refreshToken = window.localStorage.getItem('refreshToken');

        const config = { disableClose: true, id: "auth-modal" };
        return token ? of({ token, refreshToken }) : this.dialog.open(AuthComponent, config).afterClosed();
      }),
    ).subscribe((handshake) => this.authService.login$.next(handshake));
  }

  canActivate() {
    return this.authService.user$.pipe(filter(u => !!u), take(1), mapTo(true));
  }
}

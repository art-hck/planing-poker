import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanActivate } from '@angular/router';
import { filter, map, merge, of, switchMap, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { WsService } from '../../services/ws.service';
import { AuthComponent } from './auth.component';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private ws: WsService
  ) {
    // handshake если разлогин или подключение к сокетам
    merge(this.ws.openWs$, this.authService.logout$).pipe(
      filter(() => !this.dialog.getDialogById('auth-modal')),
      switchMap(() => {
        const token = window?.localStorage.getItem('token');
        const refreshToken = window?.localStorage.getItem('refreshToken');

        const config = { disableClose: true, id: 'auth-modal' };
        return token ? of({ token, refreshToken }) : this.dialog.open(AuthComponent, config).afterClosed();
      }),
    ).subscribe((handshake) => this.authService.login$.next(handshake));
  }

  canActivate() {
    return this.authService.user$.pipe(filter(u => !!u), take(1), map(() => true));
  }
}

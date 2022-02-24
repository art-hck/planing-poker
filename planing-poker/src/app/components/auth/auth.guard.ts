import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { filter, mapTo, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate() {
    return this.authService.user$.pipe(filter(u => !!u), take(1), mapTo(true));
  }
}

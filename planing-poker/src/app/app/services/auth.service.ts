import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Handshake, Room, RoomRole, User } from '@common/models';
import { ReplaySubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly beforeLogout$ = new Subject<{ emitEvent?: boolean } | void>();
  readonly logout$ = new Subject<{ emitEvent?: boolean } | void>();
  readonly login$ = new ReplaySubject<Handshake>(1);
  readonly user$ = new ReplaySubject<User | null>(1);

  constructor(private router: Router) {
    this.logout$.subscribe(d => {
      this.beforeLogout$.next(d);
      window?.localStorage.removeItem('token');
      window?.localStorage.removeItem('refreshToken');
      this.user$.next(null);
    });

    window?.addEventListener('storage', e => e.key === 'token' && e.newValue === null && this.logout$.next());
  }

  hasRole(user: User, role: RoomRole, room?: Room<true>): boolean {
    return !!room?.users.find(([id]) => id === user.id)?.[1].includes(role);
  }

  isAdmin(user: User, room?: Room<true>): boolean {
    return user.su || this.hasRole(user, RoomRole.admin, room);
  }

  get googleAuthLink() {
    return 'https://accounts.google.com/o/oauth2/v2/auth' + this.router.createUrlTree(['.'], {
      queryParams: {
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile',
        client_id: environment.googleClientId,
        redirect_uri: this.googleRedirectUri,
        response_type: 'code'
      }
    }).toString().slice(1);
  }

  get googleRedirectUri(): string {
    return location?.origin + '/google-auth';
  }
}

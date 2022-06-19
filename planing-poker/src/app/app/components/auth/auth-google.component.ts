import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Handshake } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';

@Component({
  template: '',
})
export class AuthGoogleComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  constructor(private route: ActivatedRoute, router: Router, private authService: AuthService, private pp: PlaningPokerWsService) {
    this.route.queryParams
      .pipe(filter(({ code }) => code), takeUntil(this.destroy$))
      .subscribe(params => {
        const token = window?.localStorage.getItem('token'); // Если есть токен, то связываем пользователя, если нет - регестрируем
        const googleCode = params['code'];
        const googleRedirectUri = this.authService.googleRedirectUri;
        token ? this.pp.linkGoogle(token, params['code'], googleRedirectUri) : this.authService.login$.next({ googleCode, googleRedirectUri } as Handshake);
      });

    this.pp.events({
      user: () => router.navigate(["/"]),
      invalidToken: () => router.navigate(["/"]),
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

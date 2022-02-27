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
    route.queryParams
      .pipe(filter(({ code }) => code), takeUntil(this.destroy$))
      .subscribe(params => {
        const token = window?.localStorage.getItem('token'); // Если есть токен, то связываем пользователя, если нет - регестрируем
        const googleCode = params['code'];
        token ? this.pp.linkGoogle(token, params['code']) : this.authService.login$.next({ googleCode } as Handshake);
      });

    this.pp.events({
      handshake: () => router.navigate(["/"]),
      invalidToken: () => router.navigate(["/"]),
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

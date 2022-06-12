import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DialogService } from '../shared/modules/dialog/dialog.service';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Store } from '@ngxs/store';
import { filter, fromEvent, switchMap, takeUntil, tap, timer, withLatestFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { LimitSnackbarComponent } from './components/limit-snackbar/limit-snackbar.component';
import { AuthService } from './services/auth.service';
import { HistoryService } from './services/history.service';
import { PlaningPokerWsService } from './services/planing-poker-ws.service';
import { SidebarsService } from './services/sidebars.service';
import { WsService } from './services/ws.service';

@Component({
  selector: 'pp-root',
  template: `<router-outlet></router-outlet>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platform: any,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private dialog: DialogService,
    private store: Store,
    private pp: PlaningPokerWsService,
    private ws: WsService,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public sidebars: SidebarsService,
    private sw: SwUpdate,
    private historyService: HistoryService
  ) {
    historyService.init();

    this.sw.versionUpdates.pipe(filter(e => e.type === 'VERSION_READY')).subscribe(() => {
      this.snackBar.open('Доступна новая версия приложения!', 'Обновить').onAction().subscribe(() => document?.location.reload());
    });

    if (isPlatformBrowser(this.platform) && environment.yandexMetrikaId) {
      const ym = (window as any)?.ym;
      ym(environment.yandexMetrikaId, "init", environment.yandexMetrikaOptions ?? {});

      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        tap(e => ym(environment.yandexMetrikaId, 'hit', (e as NavigationEnd).urlAfterRedirects))
      ).subscribe();
    }

    matIconRegistry.addSvgIcon('google', this.domSanitizer.bypassSecurityTrustResourceUrl('assets/google-icon.svg'));

    this.authService.beforeLogout$.subscribe(options => {
      if (!options || options.emitEvent) this.pp.bye();
      this.ws.handshaked$.next(false);
    });

    this.authService.login$.subscribe(payload => this.pp.handshake(payload));
  }

  ngOnInit() {
    const hide$ = fromEvent(document, 'visibilitychange').pipe(filter(() => document.hidden));
    const show$ = fromEvent(document, 'visibilitychange').pipe(filter(() => !document.hidden));

    hide$.pipe(
      withLatestFrom(this.ws.connected$),
      filter(([, c]) => c && !this.dialog.getDialogById('reconnectDialog')),
      switchMap(() => timer( 15 * 60 * 1000).pipe(takeUntil(show$))),
      tap(() => this.ws.disconnect(false)),
      switchMap(() => this.dialog.confirm({
        id: 'reconnectDialog',
        disableClose: true,
        data: {
          title: 'Соединение закрыто',
          content: 'Приложение было не активно более 15 минут и вы были отключены от сервера. Для продолжения работы переподключитесь, или обновите страницу.',
          submit: 'Переподключиться'
        },
      }))
    ).subscribe(() => this.ws.connect());


    this.pp.events({
      handshake: ({ refreshToken, token }) => {
        window?.localStorage.setItem('token', token);
        window?.localStorage.setItem('refreshToken', refreshToken);
        this.ws.handshaked$.next(true);
      },
      user: user => this.authService.user$.next(user),
      // Выходим из модального окна, что б оно не показывалось по нажатию на "назад"
      newRoom: ({ roomId }) => this.router.navigate(['..'], { replaceUrl: true })
          .then(() => this.router.navigate(['room', roomId])),
      notFound: () => this.router.navigate(['not-found'], { skipLocationChange: true }),
      denied: () => {
        this.router.navigate(['forbidden'], { skipLocationChange: true });
        this.authService.logout$.next();
      },
      invalidToken: () => this.authService.logout$.next({ emitEvent: false }),
      limitsError: ({ limits }) => this.snackBar.openFromComponent(LimitSnackbarComponent, { data: limits }),
      feedback: ({ success }) => {
        if (success) {
          this.snackBar.open('Большое спасибо за обратную связь!', undefined, { duration: 1000 });
        }
      },
      deleteRoom: () => {
        this.snackBar.open('Комната удалена, вы были перемещены на список комнат', 'Ну ок');
        this.router.navigate(['/']);
      },
      googleAlreadyLinked: () => {
        this.snackBar.open('Данный google аккаунт уже привязан к пользователю.', 'Ну ок');
        this.router.navigate(['/']);
      }
    }).subscribe();
  }
}

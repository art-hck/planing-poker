import { Injectable } from '@angular/core';
import { WebSocketSubject } from "rxjs/webSocket";
import { bufferToggle, filter, map, merge, mergeMap, Observable, ReplaySubject, Subject, take, tap, timer, windowToggle } from "rxjs";
import { AuthService } from "../components/auth/auth.service";
import jwt_decode from "jwt-decode";
import { WsAction, WsEvent, WsMessage } from "@common/models";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private ws$!: WebSocketSubject<WsMessage<any>>;
  private read$ = new Subject<WsMessage<any>>();
  private send$ = new Subject<WsMessage<any>>();
  readonly connected$ = new ReplaySubject<boolean>(1);

  constructor(private authService: AuthService) {
    this.connect();

    // Все эмиты разлогина (rejected)
    const off$ = this.connected$.pipe(filter(v => !v));
    // Все эмиты успешной авторизации (granted)
    const on$ = this.connected$.pipe(filter(v => v));

    merge(
      this.send$.pipe(bufferToggle(off$, () => on$)),
      this.send$.pipe(windowToggle(on$, () => off$))
    ).pipe(mergeMap(x => x)).subscribe(data => this.ws$.next(data));


    this.read('reject').subscribe(() => {
      this.authService.loginAttempts++;
      this.authService.logout$.next()
    });

    this.authService.beforeLogout$.subscribe(() => {
      this.send('bye', {});
      this.connected$.next(false);
    })

  }

  private connect() {
    this.ws$?.unsubscribe();
    this.ws$?.complete();
    this.ws$ = new WebSocketSubject<WsMessage>({
      url: environment.websocketHost || `ws://${window?.location.hostname}:9000`,
      openObserver: {
        next: () => {
          this.authService.login$.pipe(
            mergeMap(payload => {
              this.send('handshake', payload, { force: true });
              return this.read('handshake').pipe(take(1));
            }),
            tap(({ token }) => window.localStorage.setItem('token', token)),
            tap(({ token }) => this.authService.user$.next(jwt_decode(token))),
            tap(() => this.connected$.next(true))
          ).subscribe()
        }
      },
      closeObserver: {
        next: () => {
          this.connected$.next(false);
          timer(2000).subscribe(() => this.connect())
        }
      }
    });

    this.ws$.subscribe(event => this.read$.next(event));

  }

  public send<A extends keyof WsAction, P extends WsAction[A]>(action: A, payload: P, options?: WsSendOptions) {
    // console.log('SEND -> ', action, payload);
    const data: WsMessage = { action, payload };
    const token = window.localStorage.getItem('token');
    if (token) data.token = token;
    options?.force ? this.ws$.next(data) : this.send$.next(data);
  }


  public read<E extends keyof WsEvent, P extends WsEvent[E]>(event: E): Observable<P> {
    // console.log('READ <- ', event);
    return this.read$.pipe(filter(p => p.event === event), map(p => p.payload));
  }
}

type WsSendOptions = {
  force?: boolean
}

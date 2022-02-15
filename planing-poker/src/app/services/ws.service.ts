import { Injectable } from '@angular/core';
import { WebSocketSubject } from "rxjs/webSocket";
import { filter, iif, map, mergeMap, Observable, of, ReplaySubject, Subject, take, tap, timer } from "rxjs";
import { AuthService } from "../components/auth/auth.service";
import jwt_decode from "jwt-decode";
import { WsAction, WsEvent, WsMessage } from "@common/models";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private ws$!: WebSocketSubject<WsMessage<any>>;
  private events$ = new Subject<WsMessage<any>>();
  readonly connected$ = new ReplaySubject<boolean>(1);

  constructor(private authService: AuthService) {
    this.connect();
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

    this.ws$.subscribe(event => this.events$.next(event));

    this.read('reject').subscribe(() => {
      this.authService.loginAttempts++;
      this.authService.logout$.next()
    });

    this.authService.beforeLogout$.subscribe(() => {
      this.send('bye', {});
      this.connected$.next(false);
    })
  }

  public send<A extends keyof WsAction, P extends WsAction[A]>(action: A, payload: P, options?: WsSendOptions) {
    // console.log('SEND -> ', action, payload);
    iif(() => !!options?.force, of(null), this.connected$.pipe(filter(c => c))).subscribe(() => {
      const data: WsMessage = { action, payload };
      const token = window.localStorage.getItem('token');
      if (token) data.token = token;
      this.ws$.next(data)
    });
  }


  public read<E extends keyof WsEvent, P extends WsEvent[E]>(event: E): Observable<P> {
    // console.log('READ <- ', event);
    return this.events$.pipe(filter(p => p.event === event), map(p => p.payload));
  }
}

type WsSendOptions = {
  force?: boolean
}

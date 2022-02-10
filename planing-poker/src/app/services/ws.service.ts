import { Injectable } from '@angular/core';
import { WebSocketSubject } from "rxjs/webSocket";
import { filter, iif, map, mergeMap, Observable, of, ReplaySubject, take, tap } from "rxjs";
import { AuthService } from "../components/auth/auth.service";
import jwt_decode from "jwt-decode";
import { WsAction, WsEvent, WsMessage } from "@common/models";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private readonly ws$: WebSocketSubject<WsMessage<any>>;
  private readonly connected$ = new ReplaySubject<boolean>();

  constructor(private authService: AuthService) {
    this.ws$ = new WebSocketSubject({
      url: environment.websocketHost || 'ws://localhost:9000',
      openObserver: {
        next: () => {
          this.authService.login$.pipe(
            mergeMap(payload => {
              this.send('handshake', payload!, { force: true });
              return this.read('handshake');
            }),
            tap(({ token }) => window.localStorage.setItem('token', token)),
            tap(({ token }) => this.authService.user$.next(jwt_decode(token))),
            tap(() => this.connected$.next(true))
          ).subscribe()
        }
      }
    });
    this.ws$.subscribe();

    this.read('reject').subscribe(() => {
      this.authService.loginAttempts++;
      this.authService.logout$.next()
    });

    this.authService.beforeLogout$.subscribe(() => {
      this.send('bye', {}, { withCredentials: true })
    })
  }

  public send<E extends keyof WsAction, P extends WsAction[E]>(action: E, payload: P, options?: WsSendOptions) {
    // console.log('SEND -> ', action, payload);
    if (options?.withCredentials) {
      const token = window.localStorage.getItem('token');
      payload = { ...payload, token };
    }
    iif(() => !!options?.force, of(null), this.connected$.pipe(take(1), filter(c => c)))
      .subscribe(() => this.ws$.next({ action, payload }));

  }


  public read<E extends keyof WsEvent, P extends WsEvent[E]>(event: E): Observable<P> {
    // console.log('READ <- ', event);
    return this.ws$.pipe(filter(p => p.event === event), map(p => p.payload));
  }
}

type WsSendOptions = {
  force?: boolean,
  withCredentials?: boolean
}

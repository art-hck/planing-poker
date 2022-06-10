import { Injectable } from '@angular/core';
import { WsAction, WsEvent, WsMessage } from '@common/models';
import { BehaviorSubject, bufferToggle, distinctUntilChanged, filter, map, merge, mergeMap, Observable, Subject, timer, windowToggle } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private ws$!: WebSocketSubject<WsMessage<any>>;
  private readonly read$ = new Subject<WsMessage<any>>();
  private readonly send$ = new Subject<WsMessage<any>>();
  private readonly _connected$ = new BehaviorSubject<boolean>(false);
  public readonly handshaked$ = new BehaviorSubject<boolean>(false);
  private autoReconnect = true;

  get connected$() {
    return this._connected$.asObservable();
  }

  constructor() {
    this.connect();

    // Все эмиты разлогина
    const off$ = this.handshaked$.pipe(distinctUntilChanged(), filter(v => !v));
    // Все эмиты успешной авторизации
    const on$ = this.handshaked$.pipe(distinctUntilChanged(), filter(v => v));

    merge(
      this.send$.pipe(bufferToggle(off$, () => on$)),
      this.send$.pipe(windowToggle(on$, () => off$))
    ).pipe(mergeMap(x => x)).subscribe(data => this.ws$.next(data));
  }

  disconnect(reconnect = true) {
    this.autoReconnect = reconnect;
    this.ws$?.unsubscribe();
    this.ws$?.complete();
  }

  connect() {
    this.disconnect();
    this.ws$ = new WebSocketSubject<WsMessage>({
      url: environment.websocketHost || `ws://${window?.location.hostname}:9000`,
      openObserver: { next: () => this._connected$.next(true) },
      closeObserver: {
        next: () => {
          this._connected$.next(false);
          this.handshaked$.next(false);
          if (this.autoReconnect) {
            timer(2000).subscribe(() => this.connect());
          }
        }
      }
    });

    this.ws$.subscribe(event => this.read$.next(event));

  }

  public send<A extends keyof WsAction, P extends WsAction[A]>(action: A, payload: P, options?: WsSendOptions) {
    // console.log('SEND -> ', action, payload);
    const data: WsMessage = { action, payload };
    options?.force ? this.ws$.next(data) : this.send$.next(data);
  }


  public read<E extends keyof WsEvent, P extends WsEvent[E]>(event: E): Observable<P> {
    return this.read$.pipe(
      filter(p => p.event === event), map(p => p.payload)
      // tap((p) => console.log('READ <- ', event, p)),
    );
  }
}

type WsSendOptions = {
  force?: boolean
}

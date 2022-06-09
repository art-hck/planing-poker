import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WsAction, WsEvent, WsMessage } from '@common/models';
import {
  BehaviorSubject,
  bufferToggle,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  merge,
  mergeMap,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
  windowToggle
} from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { ConfirmComponent } from '../../shared/component/confirm/confirm.component';

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private ws$!: WebSocketSubject<WsMessage<any>>;
  private readonly read$ = new Subject<WsMessage<any>>();
  private readonly send$ = new Subject<WsMessage<any>>();
  public readonly connected$ = new BehaviorSubject<boolean>(false);
  public readonly openWs$ = new ReplaySubject<void>(1);
  private autoReconnect = true;

  constructor(private dialog: MatDialog) {
    const hide$ = fromEvent(document, 'visibilitychange').pipe(filter(() => document.hidden));
    const show$ = fromEvent(document, 'visibilitychange').pipe(filter(() => !document.hidden));

    hide$.pipe(
      filter(() => !this.dialog.getDialogById('reconnectDialog')),
      switchMap(() => timer(15 * 60 * 1000).pipe(takeUntil(show$))),
      tap(() => this.autoReconnect = false),
      tap(() => this.disconnect()),
      // @TODO: диалогу не место в этом сервисе
      switchMap(() => this.dialog.open(ConfirmComponent, {
          id: 'reconnectDialog',
          data: {
            title: 'Соединение с сервером закрыто',
            content: 'Вы не активны более 15 минут и были отключены',
            submit: 'Переподключиться'
          }, disableClose: true
        }).afterClosed()
      ),
      tap(() => this.autoReconnect = true)
    ).subscribe(() => this.connect());

    this.connect();

    // Все эмиты разлогина
    const off$ = this.connected$.pipe(distinctUntilChanged(), filter(v => !v));
    // Все эмиты успешной авторизации
    const on$ = this.connected$.pipe(distinctUntilChanged(), filter(v => v));

    merge(
      this.send$.pipe(bufferToggle(off$, () => on$)),
      this.send$.pipe(windowToggle(on$, () => off$))
    ).pipe(mergeMap(x => x)).subscribe(data => this.ws$.next(data));
  }

  private disconnect() {
    this.ws$?.unsubscribe();
    this.ws$?.complete();
  }

  private connect() {
    this.disconnect();
    this.ws$ = new WebSocketSubject<WsMessage>({
      url: environment.websocketHost || `ws://${window?.location.hostname}:9000`,
      openObserver: { next: () => this.openWs$.next() },
      closeObserver: {
        next: () => {
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

import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { bufferWhen, filter, fromEvent, Subject, withLatestFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly history: string[] = [];
  private readonly _urlChanges$ = new Subject();

  constructor(private router: Router, private location: Location) {}

  init() {
    const navEnd$ = this.router.events.pipe(filter(e => e instanceof NavigationEnd));
    this.location.onUrlChange(e => this._urlChanges$.next(e));
    // Срабатывает и на back и на forward, @TODO: нужно только back
    fromEvent(window, 'popstate').pipe(
      bufferWhen(() => navEnd$), // триггер этого события выдает буффер эмитов history.back() / forward
      filter(b => b.length === 0), // и если буффер пустой то мы пушим в историю
      withLatestFrom(navEnd$)
    ).subscribe(() => {
      this.history.push(this.router.url);
    });
  }

  back(route?: ActivatedRoute): void {
    const canWeBack = this.history.length > 1;
    this.history.pop();
    canWeBack ? window.history.back() : this.router.navigate(['..'], { relativeTo: route, replaceUrl: true });
  }

  get urlChanges$() {
    return this._urlChanges$;
  }
}

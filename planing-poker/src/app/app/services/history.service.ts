import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { bufferWhen, filter, fromEvent, withLatestFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly history: string[] = [];

  constructor(private router: Router) {}

  init() {
    const navEnd$ = this.router.events.pipe(filter(e => e instanceof NavigationEnd));

    // Срабатывает и на back и на forward а нужно только на back
    fromEvent(window, 'popstate').pipe(
      bufferWhen(() => navEnd$), // триггер этого события выдает буффер эмитов history.back() / forward (@TODO: нужно только back)
      filter(b => b.length === 0), // и если они были то мы не пушим в историю
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
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private defaultTitle = 'Planing Poker';
  title$ = new BehaviorSubject(this.defaultTitle);
  click$ = new Subject<void>();

  reset() {
    this.title$.next(this.defaultTitle);
  }

  click() {
    this.click$.next();
  }
}

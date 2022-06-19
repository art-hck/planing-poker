import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private readonly defaultTitle = 'Planing Poker';
  private readonly _title$ = new BehaviorSubject<string>(this.defaultTitle);
  readonly click$ = new Subject<void>();

  get title$() {
    return this._title$.asObservable();
  }

  set(title: string) {
    this._title$.next(title);
  }

  reset() {
    this.set(this.defaultTitle);
  }

  click() {
    this.click$.next();
  }
}

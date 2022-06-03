import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private defaultTitle = 'Planing Poker';
  title$ = new BehaviorSubject(this.defaultTitle);

  reset() {
    this.title$.next(this.defaultTitle);
  }
}

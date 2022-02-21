import { Injectable } from '@angular/core';
import { debounceTime, fromEvent, map, shareReplay, startWith } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ResolutionService {
  readonly resize$ = fromEvent(window, 'resize').pipe(
    debounceTime(200),
    startWith(null),
    map(() => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth),
    shareReplay(1)
  );
  readonly isMobile$ = this.resize$.pipe(map(w => w <= 1000));
}

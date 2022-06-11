import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { TitleService } from '../../../app/services/title.service';

@Component({
  selector: 'pp-rooms-home',
  templateUrl: './rooms-home.component.html',
  styleUrls: ['./rooms-home.component.scss']
})
export class RoomsHomeComponent implements OnDestroy {
  readonly destroy$ = new Subject<void>();

  constructor(public pp: PlaningPokerWsService, public titleService: TitleService) {
    this.titleService.reset();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

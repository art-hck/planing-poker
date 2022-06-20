import { Component, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
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

  constructor(public pp: PlaningPokerWsService, public titleService: TitleService, private t: TranslocoService, private meta: Meta) {
    this.t.selectTranslate('rooms.homeTitle').subscribe(homeTitle => {
      this.titleService.set(homeTitle);
      this.meta.updateTag({ name: 'description', content: homeTitle });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

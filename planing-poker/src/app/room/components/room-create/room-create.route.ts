import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { merge, Subject, takeUntil } from 'rxjs';
import { HistoryService } from '../../../app/services/history.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { RoomCreateComponent } from './room-create.component';

@Component({ template: '' })
export class RoomCreateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: DialogService, private pp: PlaningPokerWsService, private history: HistoryService, private route: ActivatedRoute) {
    this.dialog.big(RoomCreateComponent)
      .pipe(takeUntil(merge(this.history.urlChanges$, this.destroy$)))
      .subscribe(r => {
        if (r) {
          r.name ? this.pp.newRoom(r.name, r.points, r.canPreviewVotes, r.alias, r.password) : null;
        } else {
          this.history.back(this.route);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

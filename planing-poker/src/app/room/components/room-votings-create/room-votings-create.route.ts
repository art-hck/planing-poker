import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { merge, Subject, takeUntil, withLatestFrom } from 'rxjs';
import { HistoryService } from '../../../app/services/history.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { RoomVotingsCreateComponent } from './room-votings-create.component';

@Component({ template: '' })
export class RoomVotingsCreateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: DialogService, private pp: PlaningPokerWsService, private route: ActivatedRoute, private history: HistoryService) {
    this.dialog.big(RoomVotingsCreateComponent).pipe(
      withLatestFrom(this.pp.roomShared$),
      takeUntil(merge(this.history.urlChanges$, this.destroy$))
    ).subscribe(([data, room]) => {
      if (data) {
        this.pp.newVoting(room.id, data.names.split('\n'));
      }

      this.history.back(this.route);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

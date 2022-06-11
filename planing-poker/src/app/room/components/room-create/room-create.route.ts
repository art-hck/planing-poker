import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { merge, Subject, takeUntil } from 'rxjs';
import { HistoryService } from '../../../app/services/history.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DefaultDialogConfig } from '../../../shared/util/default-dialog-config';
import { RoomCreateComponent } from './room-create.component';

@Component({ template: '' })
export class RoomCreateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private history: HistoryService, private route: ActivatedRoute) {
    this.dialog.open(RoomCreateComponent, DefaultDialogConfig).afterClosed()
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

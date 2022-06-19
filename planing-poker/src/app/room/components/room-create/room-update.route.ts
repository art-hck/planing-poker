import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, merge, Subject, switchMap, take, takeUntil } from 'rxjs';
import { HistoryService } from '../../../app/services/history.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { RoomCreateComponent } from './room-create.component';

@Component({ template: '' })
export class RoomUpdateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: DialogService,
    private pp: PlaningPokerWsService,
    private router: Router,
    private route: ActivatedRoute,
    private history: HistoryService
  ) {
    this.pp.roomShared$.pipe(
      take(1),
      switchMap(room => this.dialog.big(RoomCreateComponent, { data: { room } }).pipe(map(r => [room, r]))),
      takeUntil(merge(this.history.urlChanges$, this.destroy$))
    ).subscribe(([room, form]) => {
      const aliasChanged = form && form.alias !== room.alias;
      if (form) {
        room = { ...room, ...form };
        this.pp.updateRoom(room, form.password);
      }

      if (aliasChanged) {
        this.router.navigate(['room', form.alias || room.id], { replaceUrl: true });
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

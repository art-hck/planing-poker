import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, take, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { RoomSettingsComponent } from './room-settings.component';

@Component({ template: '' })
export class RoomSettingsRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: DialogService, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.pp.roomShared$.pipe(
      take(1),
      switchMap(room => {
        return this.dialog.small(RoomSettingsComponent, { data: { room }, autoFocus: false });
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.dialog.matDialog.closeAll();
  }
}

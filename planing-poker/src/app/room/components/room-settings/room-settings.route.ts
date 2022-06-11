import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomSettingsComponent } from './room-settings.component';

@Component({ template: '' })
export class RoomSettingsRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.pp.room$.pipe(
      switchMap(room => {
        return this.dialog.open(RoomSettingsComponent, { data: { room }, width: '350px', autoFocus: false }).afterClosed();
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => this.router.navigate(['..'], { relativeTo: this.route }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

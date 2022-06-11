import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, withLatestFrom } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomVotingsCreateComponent } from './room-votings-create.component';

@Component({ template: '' })
export class RoomVotingsCreateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.dialog.open(RoomVotingsCreateComponent, {
      width: '500px',
      panelClass: 'app-responsive-modal',
      backdropClass: 'app-responsive-backdrop'
    }).afterClosed().pipe(
      withLatestFrom(this.pp.room$),
      takeUntil(this.destroy$)
    ).subscribe(([data, room]) => {
      if (data) {
        this.pp.newVoting(room.id, data.names.split('\n'));
      }

      this.router.navigate(['..'], { relativeTo: this.route });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

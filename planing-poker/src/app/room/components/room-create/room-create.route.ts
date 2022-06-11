import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomCreateComponent } from './room-create.component';

@Component({ template: '' })
export class RoomCreateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.dialog.open(RoomCreateComponent, {
      width: '500px',
      panelClass: 'app-responsive-modal',
      backdropClass: 'app-responsive-backdrop'
    }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe(r => {
      if (r) {
        r.name ? this.pp.newRoom(r.name, r.points, r.canPreviewVotes, r.alias, r.password) : null;
      } else {
        this.router.navigate(['..'], { relativeTo: this.route });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

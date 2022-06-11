import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomCreateComponent } from './room-create.component';

@Component({ template: '' })
export class RoomUpdateRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.pp.room$.pipe(
      take(1),
      switchMap(room => this.dialog.open(RoomCreateComponent, {
        width: '500px',
        panelClass: 'app-responsive-modal',
        backdropClass: 'app-responsive-backdrop',
        data: { room }
      }).afterClosed().pipe(map(r => [room, r]))),
      takeUntil(this.destroy$)
    ).subscribe(([room, r]) => {
      const aliasChanged = r && r.alias !== room.alias;
      if (r) {
        room = { ...room, ...r };
        this.pp.updateRoom(room, r.password);
      }

      this.router.navigate(aliasChanged ? ['..', '..', r.alias || room.id] : ['..'], { replaceUrl: aliasChanged, relativeTo: this.route });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

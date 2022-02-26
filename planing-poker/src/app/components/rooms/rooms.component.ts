import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { MatDialogConfig } from '@angular/material/dialog/dialog-config';
import { Router } from '@angular/router';
import { Uuid } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { ResolutionService } from '../../services/resolution.service';
import { SidebarsService } from '../../services/sidebars.service';
import { RoomCreateComponent } from './room-create/room-create.component';
import { RoomShareDialogComponent } from './room-share/room-share.component';

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService,
    public resolutionService: ResolutionService,
    private bottomSheet: MatBottomSheet
  ) {
  }

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
    this.pp.rooms$.pipe(
      filter(r => r.length === 0),
      filter(() => this.dialog.getDialogById('new_room')?.getState() !== MatDialogState.OPEN),
      takeUntil(this.destroy$),
    ).subscribe(() => this.newRoom());

    this.sidebars.detectChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cd.detectChanges());
    this.resolutionService.isMobile$.pipe(filter(Boolean), takeUntil(this.destroy$)).subscribe(isMobile => this.sidebars.showPlayers = isMobile);
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(RoomCreateComponent, { ...config, id: 'new_room', width: '360px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name, code }) => {
        code ? this.router.navigate([code]) : name ? this.pp.newRoom(name) : null;
      });
  }

  inviteRoom(roomId: Uuid) {
    this.bottomSheet.open(RoomShareDialogComponent, { data: { roomId } });
  }

  deleteRoom(roomId: Uuid) {
    this.dialog.open(DeleteRoomConfirmDialogComponent, { width: '360px' }).afterClosed().pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe(() => this.pp.deleteRoom(roomId));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Component({
  template: `
<h2 mat-dialog-title>Удалить комнату?</h2>
<div mat-dialog-content>Отменить действие будет невозможно. Все данные о голосованиях в комнате будут также удалены.</div>
<div mat-dialog-actions [align]="'end'">
  <button mat-flat-button (click)="ref.close(false)">Отмена</button>
  <button mat-flat-button color="primary" (click)="ref.close(true)">Удалить</button>
</div>`
})
export class DeleteRoomConfirmDialogComponent {
  constructor(public ref: MatDialogRef<DeleteRoomConfirmDialogComponent>) {
  }
}

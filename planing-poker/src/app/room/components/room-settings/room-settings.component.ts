import { Component, Inject, OnDestroy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Room } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ConfirmComponent } from '../../../shared/component/confirm/confirm.component';
import { RoomCreateComponent } from '../room-create/room-create.component';
import { RoomShareDialogComponent } from '../room-share/room-share.component';

@Component({
  selector: 'pp-room-settings',
  templateUrl: './room-settings.component.html',
  styleUrls: ['./room-settings.component.scss']
})
export class RoomSettingsComponent implements OnDestroy {

  readonly destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { room: Room<true> },
    public dialogRef: MatDialogRef<RoomSettingsComponent>,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    private router: Router,
  ) {
  }

  inviteRoom() {
    this.bottomSheet.open(RoomShareDialogComponent, { data: this.data, restoreFocus: false });
  }

  deleteRoom() {
    const data = {
      title: 'Удалить комнату?',
      content: 'Отменить действие будет невозможно. Все данные о голосованиях в комнате будут также удалены.',
      cancel: 'Отмена',
      submit: 'Удалить'
    };

    this.dialog.open(ConfirmComponent, { width: '360px', data, restoreFocus: false }).afterClosed().pipe(filter(Boolean))
      .subscribe(() => {
        this.pp.deleteRoom(this.data.room.id);
        this.dialogRef.close();
      });
  }

  leaveRoom() {
    this.pp.leaveRoom(this.data.room.id);
    this.dialogRef.close();
  }

  updateRoom() {
    this.dialog.open(RoomCreateComponent, {  data: this.data, width: '500px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe((room: Partial<Room<true>>) => {
        if (room.alias && this.data.room.alias !== room.alias) {
          this.router.navigate(['room', room.alias], { replaceUrl: true });
        }
        this.data.room = { ...this.data.room, ...room };
        this.pp.updateRoom(this.data.room);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

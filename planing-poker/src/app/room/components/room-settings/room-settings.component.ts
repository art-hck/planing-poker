import { Component, Inject, OnDestroy } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Room } from '@common/models';
import { filter, Subject } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ConfirmComponent } from '../../../shared/component/confirm/confirm.component';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { RoomShareDialogComponent } from '../room-share/room-share.component';

@Component({
  selector: 'pp-room-settings',
  templateUrl: './room-settings.component.html',
  styleUrls: ['./room-settings.component.scss']
})
export class RoomSettingsComponent implements OnDestroy {

  readonly destroy$ = new Subject<void>();
  readonly activatedRouteFirstChild = activatedRouteFirstChild;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { room: Room<true> },
    private dialogRef: MatDialogRef<RoomSettingsComponent>,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private router: Router,
    private pp: PlaningPokerWsService,
    public authService: AuthService,
    public route: ActivatedRoute,
  ) {}

  inviteRoom() {
    if (navigator?.share) {
      navigator.share({
        title: this.data.room.name,
        url: window?.location?.origin + '/room/' + (this.data.room.alias || this.data.room.id)
      });
    } else {
      this.bottomSheet.open(RoomShareDialogComponent, { data: this.data });
    }
  }

  deleteRoom() {
    const data = {
      title: 'Удалить комнату?',
      content: 'Отменить действие будет невозможно. Все данные о голосованиях в комнате будут также удалены.',
      cancel: 'Отмена',
      submit: 'Удалить'
    };

    this.dialog.open(ConfirmComponent, { width: '360px', data }).afterClosed().pipe(filter(Boolean))
      .subscribe(() => {
        this.pp.deleteRoom(this.data.room.id);
        this.dialogRef.close();
      });
  }

  leaveRoom() {
    this.pp.leaveRoom(this.data.room.id);
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

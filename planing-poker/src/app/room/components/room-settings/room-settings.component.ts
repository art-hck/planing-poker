import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Room } from '@common/models';
import { Subject } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { RoomService } from '../../services/room.service';

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
    private dialog: DialogService,
    private pp: PlaningPokerWsService,
    public authService: AuthService,
    public route: ActivatedRoute,
    public roomService: RoomService,
  ) {}

  deleteRoom() {
    const data = {
      title: 'Удалить комнату?',
      content: 'Отменить действие будет невозможно. Все данные о голосованиях в комнате будут также удалены.',
      cancel: 'Отмена',
      submit: 'Удалить'
    };

    this.dialog.confirm({ data }).subscribe(() => {
      this.pp.deleteRoom(this.data.room.id);
      this.dialogRef.close();
    });
  }

  leaveRoom() {
    const data = {
      title: 'Покинуть комнату?',
      content: 'Вы не сможете учавствовать в голосованиях в этой комнате, а также смотреть результаты старых голосований.',
      cancel: 'Отмена',
      submit: 'Покинуть'
    };

    this.dialog.confirm({ data }).subscribe(() => {
      this.pp.leaveRoom(this.data.room.id);
      this.dialogRef.close();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

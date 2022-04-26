import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RolesName, Room, RoomRole, User, Uuid } from '@common/models';
import { filter } from 'rxjs';
import { AuthService } from '../../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../../app/services/planing-poker-ws.service';
import { ConfirmComponent } from '../../../../shared/component/confirm/confirm.component';

@Component({
  selector: 'pp-room-user',
  templateUrl: './room-user.component.html',
  styleUrls: ['./room-user.component.scss']
})
export class RoomUserComponent {
  @Input() user?: User;
  @Input() room?: Room<true> | null;
  @Input() votes?: Map<Uuid, string | null>;
  @Input() voteColors?: Map<string | null, string>;
  readonly roomRole = RoomRole;
  readonly role = RolesName;

  constructor(public authService: AuthService, public pp: PlaningPokerWsService, private dialog: MatDialog) {}

  get isVoted(): boolean {
    return !!this.user && this.votes?.get(this.user.id) !== undefined;
  }

  changeModerator(userId: Uuid, roomId: Uuid) {
    const data = {
      title: 'Внимание!',
      content: 'Вы собираетесь сменить модератора комнаты. Вернуть статус обратно вам сможет только новый модератор.',
      cancel: 'Отмена',
      submit: 'Сменить'
    };

    this.dialog.open(ConfirmComponent, { width: '365px', data }).afterClosed().pipe(filter(v => !!v)).subscribe(
      () => this.pp.setRole(userId, roomId, RoomRole.admin)
    );
  }

  kick(userId: Uuid, roomId: Uuid) {
    const data = {
      title: 'Внимание!',
      content: 'Вы собираетесь исключить пользователя из комнаты.',
      cancel: 'Отмена',
      submit: 'Исключить'
    };

    this.dialog.open(ConfirmComponent, { width: '365px', data }).afterClosed().pipe(filter(v => !!v)).subscribe(
      () => this.pp.leaveRoom(roomId, userId)
    );
  }
}


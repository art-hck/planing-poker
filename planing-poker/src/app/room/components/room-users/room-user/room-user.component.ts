import { Component, Input } from '@angular/core';
import { RolesName, Room, RoomRole, User, Uuid } from '@common/models';
import { AuthService } from '../../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../../shared/modules/dialog/dialog.service';

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

  constructor(public authService: AuthService, public pp: PlaningPokerWsService, private dialog: DialogService) {}

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

    this.dialog.confirm({ data }).subscribe(() => this.pp.setRole(userId, roomId, RoomRole.admin));
  }

  kick(userId: Uuid, roomId: Uuid) {
    const data = {
      title: 'Внимание!',
      content: 'Вы собираетесь исключить пользователя из комнаты.',
      cancel: 'Отмена',
      submit: 'Исключить'
    };

    this.dialog.confirm({ data }).subscribe(() => this.pp.leaveRoom(roomId, userId));
  }
}


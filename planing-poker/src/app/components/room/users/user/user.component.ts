import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RolesName, Room, RoomRole, User, Uuid } from '@common/models';
import { filter } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { PlaningPokerWsService } from '../../../../services/planing-poker-ws.service';
import { Colors } from '../../../../util/colors';

@Component({
  selector: 'pp-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {
  @Input() user?: User;
  @Input() room?: Room<true> | null;
  @Input() votes?: Map<Uuid, number | null>;
  @Input() voteColors?: Map<number | null, string>;
  readonly roomRole = RoomRole;
  readonly role = RolesName;

  constructor(public authService: AuthService, public pp: PlaningPokerWsService, private dialog: MatDialog) {}

  get userInitials(): string | undefined {
    return this.user?.name.split(" ").map(n => n[0]).slice(0,2).join("");
  }

  get isVoted(): boolean {
    return !!this.user && this.votes?.get(this.user.id) !== undefined;
  }

  stringToColor(string: string) {
    return Colors[string.split("").map(char => +char.charCodeAt(0)).reduce((a, b) => a + b, 0) % Colors.length];
  }

  changeModerator(userId: Uuid, roomId: Uuid) {
    this.dialog.open(ChangeModeratorConfirmComponent, {width: '365px'}).afterClosed().pipe(filter(v => !!v)).subscribe(
      () => this.pp.setRole(userId, roomId, RoomRole.admin)
    );
  }
}

@Component({
  template: `
<h2 mat-dialog-title>Внимание!</h2>

<div mat-dialog-content>
  Вы собираетесь сменить модератора комнаты.
  Вернуть статус обратно вам сможет только новый модератор.
</div>
<div mat-dialog-actions [align]="'end'">
  <button mat-flat-button (click)="ref.close(false)">Отмена</button>
  <button mat-flat-button color="primary" (click)="ref.close(true)">Сменить</button>
</div>`
})
export class ChangeModeratorConfirmComponent {
  constructor(public ref: MatDialogRef<ChangeModeratorConfirmComponent>) {
  }
}


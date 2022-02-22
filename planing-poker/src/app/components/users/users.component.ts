import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Room, RoomRole, User, Uuid, Voting } from '@common/models';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { Colors } from '../../util/colors';
import { AuthService } from '../auth/auth.service';
import { ShareRoomDialogComponent } from '../rooms/rooms.component';

@Component({
  selector: 'pp-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnChanges {
  @Input() users?: User[] | null;
  @Input() room?: Room<true> | null;
  @Input() activeVoting?: Voting<true> | null;

  readonly systemRole = RoomRole;
  readonly voteColors = new Map<number | null, string>();
  votes?: Map<Uuid, number | null>;

  constructor(public authService: AuthService, private dialog: MatDialog, private bottomSheet: MatBottomSheet, public pp: PlaningPokerWsService) {
  }

  ngOnChanges(c: SimpleChanges) {
    if (c['activeVoting']) {
      this.votes = new Map<Uuid, number | null>(this.activeVoting?.votes);
      this.voteColors.clear();
      Array.from(new Set(this.votes.values())).sort().forEach(vote => this.voteColors.set(vote, Colors[this.voteColors.size]));
    }
  }

  inviteRoom(roomId: Uuid) {
    this.bottomSheet.open(ShareRoomDialogComponent, { data: { roomId } });
  }

  trackByFn = (index: number, item: User) => item.id;
}

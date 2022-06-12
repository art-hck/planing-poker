import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Room, RoomRole, User, Uuid, Voting } from '@common/models';
import { Subject } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { Colors } from '../../../shared/util/colors';

@Component({
  selector: 'pp-room-users',
  templateUrl: './room-users.component.html',
  styleUrls: ['./room-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomUsersComponent implements OnChanges, OnDestroy {
  @Input() users?: User[] | null;
  @Input() room?: Room<true> | null;
  @Input() currentVoting?: Voting<true> | null;

  readonly voteColors = new Map<string | null, string>();
  readonly destroy$ = new Subject<void>();
  votes?: Map<Uuid, string | null>;
  readonly groups = [{
    name: 'Голосующие',
    roles: [RoomRole.user],
    online: true
  }, {
    name: 'Наблюдатели',
    roles: [RoomRole.observer],
    online: true
  }, {
    name: 'Оффлайн',
    roles: [],
    online: false
  }];

  constructor(public authService: AuthService, public pp: PlaningPokerWsService) {}

  ngOnChanges(c: SimpleChanges) {
    if (c['currentVoting']) {
      this.votes = new Map(this.currentVoting?.votes);
      this.voteColors.clear();
      Array.from(new Set(this.votes.values())).sort().forEach(vote => this.voteColors.set(vote, Colors[this.voteColors.size]));
    }
  }

  trackByFn = (index: number, item: User) => item.id;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

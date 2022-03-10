import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Room, Voting } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomVotingsDeleteComponent } from '../room-votings-delete/room-votings-delete.component';

@Component({
  selector: 'pp-room-votings',
  templateUrl: './room-votings.component.html',
  styleUrls: ['./room-votings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomVotingsComponent implements OnDestroy {
  @Input() votings?: Voting<true>[] | null;
  @Input() room?: Room<true>;
  @Output() choose = new EventEmitter<Voting<true>>();
  readonly destroy$ = new Subject<void>();

  constructor(private sheet: MatBottomSheet, public authService: AuthService, private pp: PlaningPokerWsService) {
  }

  trackByFn = (index: number, item: Voting<true>) => item.id;


  deleteVoting(e: Event, voting: Voting<true>) {
    e.preventDefault();
    e.stopPropagation();
    this.sheet.open(RoomVotingsDeleteComponent, { data: { voting } }).afterDismissed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(() => this.pp.deleteVoting(voting.id));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Room, Voting } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { RoomVotingsDeleteComponent } from '../room-votings-delete/room-votings-delete.component';
import { RoomVotingsEditComponent } from '../room-votings-edit/room-votings-edit.component';

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

  constructor(
    private sheet: MatBottomSheet,
    private dialog: MatDialog,
    public authService: AuthService,
    private pp: PlaningPokerWsService
  ) {}

  trackByFn = (index: number, item: Voting<true>) => item.id;


  deleteVoting(voting: Voting<true>) {
    this.sheet.open(RoomVotingsDeleteComponent, { data: { voting } }).afterDismissed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(() => this.pp.deleteVoting(voting.id));
  }

  editVoting(voting: Voting<true>) {
    this.dialog.open(RoomVotingsEditComponent, { width: '500px', data: { voting } }).afterClosed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name }) => this.pp.editVoting(voting.id, name));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

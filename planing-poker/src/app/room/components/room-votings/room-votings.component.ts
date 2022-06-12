import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Room, Voting } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { RoomVotingsEditComponent } from '../room-votings-edit/room-votings-edit.component';

@Component({
  selector: 'pp-room-votings',
  templateUrl: './room-votings.component.html',
  styleUrls: ['./room-votings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomVotingsComponent implements OnDestroy {
  @Input() votings?: Voting<true>[] | null;
  @Input() activeVoting?: Voting<true> | null;
  @Input() currentVoting?: Voting<true> | null;
  @Input() room?: Room<true>;
  @Output() choose = new EventEmitter<Voting<true>>();
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: DialogService,
    public authService: AuthService,
    private pp: PlaningPokerWsService
  ) {}

  trackByFn = (index: number, item: Voting<true>) => item.id;

  deleteVoting(voting: Voting<true>) {
    this.dialog.confirm({ data: {
      title: `Удалить стори ${voting.name}?`,
      cancel: 'Отмена',
      submit: 'Удалить'
    } }).subscribe(() => this.pp.deleteVoting(voting.id));
  }

  editVoting(voting: Voting<true>) {
    this.dialog.big(RoomVotingsEditComponent, { data: { voting } })
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name }) => this.pp.editVoting(voting.id, name));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

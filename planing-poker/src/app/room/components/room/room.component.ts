import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { User, Voting } from '@common/models';
import { Select, Store } from '@ngxs/store';
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  merge,
  mergeMap,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil, tap,
  withLatestFrom
} from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { TitleService } from '../../../app/services/title.service';
import { WsService } from '../../../app/services/ws.service';
import { Users } from '../../actions/users.actions';
import { Votings } from '../../actions/votings.actions';
import { UsersState } from '../../states/users.state';
import { VotingsState } from '../../states/votings.state';
import { RoomSettingsComponent } from '../room-settings/room-settings.component';
import { RoomVotingsCreateComponent } from '../room-votings-create/room-votings-create.component';

@Component({
  selector: 'pp-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements OnInit, OnDestroy {

  @Select(UsersState.users) users$!: Observable<User[]>;
  @Select(VotingsState.votings) votings$!: Observable<Voting<true>[]>;
  @Select(VotingsState.activeVoting) activeVoting$!: Observable<Voting<true>>;
  currentVoting$ = this.route.queryParams.pipe(switchMap(({ votingId }) => {
    return this.store.select(VotingsState.voting(votingId));
  }));
  step$ = merge(
    this.pp.restartVoting$.pipe(mapTo(1)),
    this.currentVoting$.pipe(map(v => v ? v?.status === 'end' ? 2 : 1 : 0)),
    this.pp.flip$.pipe(mapTo(2))
  );
  readonly destroy$ = new Subject<void>();
  readonly room$ = this.pp.room$.pipe(
    tap(room => {
      this.titleService.title$.next(room.name);
      this.title.setTitle(`${room.name} - PlaningPoker`);
    }), shareReplay(1));

  constructor(
    public sidebars: SidebarsService,
    public authService: AuthService,
    public pp: PlaningPokerWsService,
    private title: Title,
    private titleService: TitleService,
    private ws: WsService,
    private dialog: MatDialog,
    private store: Store,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.titleService.click$.pipe(
      withLatestFrom(this.room$),
      takeUntil(this.destroy$)
    ).subscribe(([, room]) => {
      this.dialog.open(RoomSettingsComponent, { data: { room }, width: '350px', autoFocus: false, restoreFocus: false });
    });

    this.route.params.pipe(
      mergeMap(p => this.authService.user$.pipe(
        distinctUntilChanged((p, c) => p?.id === c?.id),
        filter(u => !!u), mapTo(p)
      )),
      withLatestFrom(this.room$.pipe(startWith(null))),
      takeUntil(this.destroy$)
    ).subscribe(([{ id }, room]) => {
      if (room) {
        this.pp.disconnectRoom(room.id);
      }
      this.pp.joinRoom(id);
    });

    this.sidebars.detectChanges$.subscribe(() => this.cd.detectChanges());

    this.pp.leaveRoom$.pipe(
      withLatestFrom(this.room$),
      takeUntil(this.destroy$)
    ).subscribe(([{ roomId }, room]) => {
      this.pp.rooms();
      if (room?.id === roomId) {
        this.router.navigate(['/']);
      }
    });
  }

  openNewVotingModal() {
    if (this.dialog.getDialogById('NewVotingModal')?.getState() === MatDialogState.OPEN) return;
    this.dialog.open(RoomVotingsCreateComponent, { id: 'NewVotingModal', width: '500px', panelClass: 'app-responsive-modal' }).afterClosed().pipe(
      filter(v => !!v),
      withLatestFrom(this.room$)
    ).subscribe(([data, room]) => this.pp.newVoting(room.id, data.names.split('\n')));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(new Users.Fetch([]));
    this.store.dispatch(new Votings.Fetch([]));
  }
}

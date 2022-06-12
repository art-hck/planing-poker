import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { User, Voting } from '@common/models';
import { Select, Store } from '@ngxs/store';
import { filter, map, merge, Observable, shareReplay, skip, startWith, Subject, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { TitleService } from '../../../app/services/title.service';
import { Users } from '../../actions/users.actions';
import { Votings } from '../../actions/votings.actions';
import { UsersState } from '../../states/users.state';
import { VotingsState } from '../../states/votings.state';
import { RoomPasswordComponent } from '../room-password/room-password.component';

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
  readonly currentVoting$ = this.route.queryParams.pipe(switchMap(({ votingId }) => {
    return this.store.select(VotingsState.voting(votingId));
  }));
  step$ = merge(
    this.pp.restartVoting$.pipe(map(() => 1)),
    this.currentVoting$.pipe(map(v => v ? v?.status === 'end' ? 2 : 1 : 0)),
    this.pp.flip$.pipe(map(() => 2))
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
    private dialog: MatDialog,
    private store: Store,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.titleService.click$.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.router.navigate(['settings'], { relativeTo: this.route, replaceUrl: true }));

    // Если меняется роут, или пользователь (разлогин / переподключение)
    merge(
      this.authService.user$.pipe(filter(u => !!u), map(() => this.route.snapshot.params)),
      this.route.params.pipe(skip(1))
    ).pipe(
      withLatestFrom(this.room$.pipe(startWith(null))),
      takeUntil(this.destroy$)
    ).subscribe(([{ id }, room]) => {
      if (room) {
        this.pp.disconnectRoom(room.id);
      }
      this.pp.joinRoom(id);
    });

    this.pp.requireRoomPassword$.pipe(
      switchMap(() => this.dialog.open(RoomPasswordComponent, {
        width: '350px',
        disableClose: true,
        autoFocus: true
      }).afterClosed()),
      filter(v => !!v),
      takeUntil(this.destroy$)
    ).subscribe(({ password }) => this.pp.joinRoom(this.route.snapshot.params['id'], password));

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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(new Users.Fetch([]));
    this.store.dispatch(new Votings.Fetch([]));
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { User, Voting } from '@common/models';
import { Select, Store } from '@ngxs/store';
import { filter, map, merge, Observable, shareReplay, skip, startWith, Subject, switchMap, takeUntil, tap, timer, withLatestFrom } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { TitleService } from '../../../app/services/title.service';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
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
  readonly step$ = merge(
    this.pp.restartVoting$.pipe(map(() => 1)),
    this.currentVoting$.pipe(map(v => v ? v?.status === 'end' ? 2 : 1 : 0)),
    this.pp.flip$.pipe(map(() => 2))
  );
  readonly destroy$ = new Subject<void>();
  readonly joinRoom$ = new Subject<void>();
  readonly room$ = merge(
    // Когда переходим с комнаты на комнату обнуляем значение потока
    this.joinRoom$.pipe(switchMap(() => timer(500).pipe(map(() => undefined), takeUntil(this.pp.room$)))),
    this.pp.roomShared$
  ).pipe(
    tap(room => {
      if (!room) return;
      this.titleService.set(room.name);
      this.title.setTitle(`${room.name} - PlaningPoker`);
      this.meta.updateTag({ name: 'description', content: `${room.name} - PlaningPoker` });
    }),
    shareReplay(1),
  );

  constructor(
    public sidebars: SidebarsService,
    public authService: AuthService,
    public pp: PlaningPokerWsService,
    private title: Title,
    private meta: Meta,
    private titleService: TitleService,
    private dialog: DialogService,
    private store: Store,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.titleService.set("");
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
      this.joinRoom$.next();
      this.pp.joinRoom(id);
    });

    this.pp.requireRoomPassword$.pipe(
      switchMap(() => this.dialog.small(RoomPasswordComponent, { disableClose: true, autoFocus: true })),
      filter(v => !!v),
      tap(() => this.joinRoom$),
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

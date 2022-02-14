import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CreateVoteComponent } from "../create-vote/create-vote.component";
import { filter, map, mapTo, merge, mergeMap, Observable, Subject, switchMap, take, takeUntil, withLatestFrom } from "rxjs";
import { Select, Store } from "@ngxs/store";
import { UsersState } from "../../states/users.state";
import { User, Voting } from "@common/models";
import { VotingsState } from "../../states/votings.state";
import { AuthService } from "../auth/auth.service";
import { WsService } from "../../services/ws.service";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SidebarsService } from "../../services/sidebars.service";
import { ActivatedRoute } from "@angular/router";

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
  step: number = 0;
  readonly destroy$ = new Subject<void>();

  constructor(
    public sidebars: SidebarsService,
    public authService: AuthService,
    public pp: PlaningPokerWsService,
    private ws: WsService,
    private dialog: MatDialog,
    private store: Store,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)) // проверить работает ли переход по урлам без дестроя компонента
      .pipe(mergeMap(p => this.authService.login$.pipe(mapTo(p))))
      .subscribe(param => this.pp.joinRoom(param['id']))

    merge(
      this.pp.restartVoting$.pipe(mapTo(1)),
      this.activeVoting$.pipe(filter(v => !!v), map(v => v ? v?.status === "end" ? 2 : 1 : 0)),
      this.pp.flip$.pipe(mapTo(2))
    ).pipe(takeUntil(this.destroy$)).subscribe(step => {
      this.step = step;
      this.cd.detectChanges();
    });

    this.pp.voted$.pipe(
      withLatestFrom(this.authService.user$),
      filter(([voted, user]) => voted.userId !== user?.id),
      switchMap(([voted]) => this.users$.pipe(take(1), map(users => users.find((u) => u.id === voted.userId)))),
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.snackBar.open(`${user?.name} проголосовал(а)`, 'Ну ок', { duration: 4000, horizontalPosition: 'right' });
    });

    this.sidebars.detectChanges$.subscribe(() => this.cd.detectChanges());
  }

  openNewVotingModal() {
    this.dialog.open(CreateVoteComponent, { width: '500px' }).afterClosed().pipe(filter(v => !!v)).subscribe(data => {
      this.pp.newVoting(this.route.snapshot.params['id'], data.name);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
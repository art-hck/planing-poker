import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from "./components/auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { CreateVoteComponent } from "./components/create-vote/create-vote.component";
import { WsService } from "./services/ws.service";
import { Select, Store } from "@ngxs/store";
import { VotingsState } from "./states/votings.state";
import { debounceTime, filter, fromEvent, map, mapTo, merge, Observable, startWith, switchMap, take, withLatestFrom } from "rxjs";
import { User, Voting } from "@common/models";
import { PlaningPokerWsService } from "./services/planing-poker-ws.service";
import { Votings } from "./actions/votings.actions";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Users } from "./actions/users.actions";
import { UsersState } from "./states/users.state";
import { MatDrawerMode } from "@angular/material/sidenav/drawer";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  @Select(UsersState.users) users$!: Observable<User[]>;
  @Select(VotingsState.votings) votings$!: Observable<Voting<true>[]>;
  @Select(VotingsState.activeVoting) activeVoting$!: Observable<Voting<true>>;

  showVotings: boolean = false;
  showPlayers: boolean = false;
  step: number = 0;
  sidenavMode: MatDrawerMode = 'over';

  constructor(
    public authService: AuthService,
    private ws: WsService,
    public pp: PlaningPokerWsService,
    private dialog: MatDialog,
    private store: Store,
    private snackBar: MatSnackBar,
    public cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.pp.users$.subscribe(users => this.store.dispatch(new Users.Fetch(users.map(([, v]) => v))));
    this.pp.voted$.subscribe(({ userId, votingId, point }) => this.store.dispatch(new Votings.Vote(userId, votingId, point)));
    this.pp.unvoted$.subscribe(({ userId, votingId }) => this.store.dispatch(new Votings.Unvote(userId, votingId)));
    this.pp.flip$.subscribe((voting) => this.store.dispatch(new Votings.Flip(voting)));
    this.pp.votings$.subscribe((votings) => this.store.dispatch(new Votings.Fetch(votings.map(([, v]) => v))))
    this.pp.activateVoting$.subscribe(({ votingId }) => this.store.dispatch(new Votings.Activate(votingId)))
    this.pp.restartVoting$.subscribe((voting) => this.store.dispatch(new Votings.Restart(voting)))

    merge(
      this.pp.restartVoting$.pipe(mapTo(1)),
      this.activeVoting$.pipe(filter(v => !!v), map(v => v ? v?.status === "end" ? 2 : 1 : 0)),
      this.pp.flip$.pipe(mapTo(2))
    ).subscribe(step => {
      this.step = step;
      this.cd.detectChanges();
    });

    this.pp.voted$.pipe(
      withLatestFrom(this.authService.user$),
      filter(([voted, user]) => voted.userId !== user?.id),
      switchMap(([voted]) => this.users$.pipe(take(1), map(users => users.find((u) => u.id === voted.userId))))
    ).subscribe(user => {
      this.snackBar.open(`${user?.name} проголосовал(а)`, 'Ну ок', { duration: 4000, horizontalPosition: 'right' });
    });

    fromEvent(window, 'resize').pipe(
      debounceTime(200),
      startWith(null),
      map(() => (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) > 1000 ? 'side' : 'over'),
      filter(sidenavMode => sidenavMode !== this.sidenavMode)
    ).subscribe(sidenavMode => {
        this.sidenavMode = sidenavMode;
        this.showVotings = sidenavMode === 'side' ? (window.localStorage.getItem('showVotings') || 'true') === 'true' : false;
        this.showPlayers = sidenavMode === 'side' ? (window.localStorage.getItem('showPlayers') || 'true') === 'true' : false;
        this.cd.detectChanges();
    });
  }

  saveSidebarsState() {
    if (this.sidenavMode === 'side') {
      window.localStorage.setItem('showVotings', this.showVotings.toString());
      window.localStorage.setItem('showPlayers', this.showPlayers.toString());
    }
  }

  openNewVotingModal() {
    this.dialog.open(CreateVoteComponent, { width: '500px' }).afterClosed().pipe(filter(v => !!v)).subscribe(data => {
      this.pp.newVoting(data.name);
    });
  }
}

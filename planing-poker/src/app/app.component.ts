import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from "./components/auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { CreateVoteComponent } from "./components/create-vote/create-vote.component";
import { WsService } from "./services/ws.service";
import { Select, Store } from "@ngxs/store";
import { UsersState } from "./states/users.state";
import { filter, map, mapTo, merge, Observable, switchMap, take, withLatestFrom } from "rxjs";
import { User, Voting } from "@common/models";
import { PlaningPokerWsService } from "./services/planing-poker-ws.service";
import { Users } from "./actions/users.actions";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  @Select(UsersState.users) users$!: Observable<(User & { voted?: boolean })[]>;
  @Select(UsersState.votings) votings$!: Observable<Voting<true>[]>;
  @Select(UsersState.activeVoting) activeVoting$!: Observable<Voting<true>>;
  @Select(UsersState.avg) avg$!: Observable<number>;

  readonly votedCount$: Observable<number> = this.users$.pipe(map(users => users.filter(u => u.voted).length))
  showVotings: boolean = (window.localStorage.getItem('showVotings') || 'true') === 'true';
  showPlayers: boolean = (window.localStorage.getItem('showPlayers') || 'true') === 'true';
  avg: number = 0;
  step: number = 0;

  constructor(
    public authService: AuthService,
    private ws: WsService,
    public pp: PlaningPokerWsService,
    private dialog: MatDialog,
    private store: Store,
    private snackBar: MatSnackBar,
    public cd: ChangeDetectorRef
  ) {
    this.pp.users$.subscribe(users => this.store.dispatch(new Users.Fetch(users.map(([k, v]) => v))));
    this.pp.voted$.subscribe(({ userId, votingId, point }) => this.store.dispatch(new Users.Voted(userId, votingId, point)));
    this.pp.unvoted$.subscribe(({ userId, votingId }) => this.store.dispatch(new Users.Unvoted(userId, votingId)));
    this.pp.flip$.subscribe((voting) => this.store.dispatch(new Users.Flip(voting)));
    this.pp.votings$.subscribe((votings) => this.store.dispatch(new Users.FetchVotings(votings.map(([k, v]) => v))))
    this.pp.activateVoting$.subscribe(({ votingId }) => this.store.dispatch(new Users.ActivateVoting(votingId)))
    this.pp.endVoting$.subscribe(({ votingId }) => this.store.dispatch(new Users.EndVoting(votingId)))

    merge(
      this.pp.endVoting$.pipe(mapTo(0)),
      this.pp.activateVoting$.pipe(mapTo(1)),
      this.pp.flip$.pipe(mapTo(2))
    ).subscribe(step => {
      this.step = step;
      this.cd.detectChanges();
    })

    this.pp.voted$.pipe(
      withLatestFrom(this.authService.user$),
      filter(([voted, user]) => voted.userId !== user?.id),
      switchMap(([voted]) => this.users$.pipe(take(1), map(users => users.find((u) => u.id === voted.userId))))
    ).subscribe(user => {
      this.snackBar.open(`${user?.name} проголосовал(а)`, 'Ну ок', { duration: 4000, horizontalPosition: 'right' });
    })
  }

  toggleVotings() {
    this.showVotings = !this.showVotings;
    window.localStorage.setItem('showVotings', this.showVotings.toString());
  }

  togglePlayers() {
    this.showPlayers = !this.showPlayers;
    window.localStorage.setItem('showPlayers', this.showPlayers.toString());
  }

  createStory() {
    this.dialog.open(CreateVoteComponent, { width: '500px' }).afterClosed().subscribe(data => {
      this.ws.send('newVoting', data);
    });
  }
}

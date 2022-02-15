import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { of, startWith, switchMap } from "rxjs";
import { AuthService } from "./components/auth/auth.service";
import { AuthComponent } from "./components/auth/auth.component";
import { MatDialog } from "@angular/material/dialog";
import { Users } from "./actions/users.actions";
import { Votings } from "./actions/votings.actions";
import { PlaningPokerWsService } from "./services/planing-poker-ws.service";
import { Store } from "@ngxs/store";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private store: Store,
    private pp: PlaningPokerWsService,
  ) {
    this.authService.logout$.pipe(
      startWith(null),
      switchMap(() => {
        const hasToken = !!window.localStorage.getItem('token');
        const config = { disableClose: true, data: { loginAttempts: this.authService.loginAttempts } };
        return hasToken ? of({}) : this.dialog.open(AuthComponent, config).afterClosed()
      }),
    ).subscribe((handshake) => this.authService.login$.next(handshake));

    // this.ws.connected$.pipe(skip(1), distinctUntilChanged()).subscribe(connected => {
    //   this.snackBar.open(connected ? 'Соединение восстановлено!' : 'Потеряно соединение...', "", { duration: connected ? 1000 : 0 });
    // });

  }

  ngOnInit() {
    this.pp.events({
      users: users => this.store.dispatch(new Users.Fetch(users.map(([, v]) => v))),
      votings: votings => this.store.dispatch(new Votings.Fetch(votings.map(([, v]) => v))),
      voted: ({ userId, votingId, point }) => this.store.dispatch(new Votings.Vote(userId, votingId, point)),
      unvoted: ({ userId, votingId }) => this.store.dispatch(new Votings.Unvote(userId, votingId)),
      flip: voting => this.store.dispatch(new Votings.Flip(voting)),
      activateVoting: ({ votingId }) => this.store.dispatch(new Votings.Activate(votingId)),
      restartVoting: voting => this.store.dispatch(new Votings.Restart(voting)),
      newRoom: ({ roomId }) => this.router.navigate([roomId]),
      notFoundRoom: () => this.router.navigate(['not-found'], { skipLocationChange: true })
    }).subscribe()
  }
}

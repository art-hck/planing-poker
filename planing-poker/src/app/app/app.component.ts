import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Users } from './actions/users.actions';
import { Votings } from './actions/votings.actions';
import { AuthService } from './services/auth.service';
import { PlaningPokerWsService } from './services/planing-poker-ws.service';
import { SidebarsService } from './services/sidebars.service';
import { WsService } from './services/ws.service';

@Component({
  selector: 'pp-root',
  template: `
    <pp-header
      [(showPlayers)]='sidebars.showPlayers'
      [(showVotings)]='sidebars.showVotings'
      (showPlayersChange)='sidebars.saveSidebarsState();'
      (showVotingsChange)='sidebars.saveSidebarsState();'
    ></pp-header>
    <router-outlet></router-outlet>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private store: Store,
    private pp: PlaningPokerWsService,
    private ws: WsService,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    public sidebars: SidebarsService,
  ) {
    matIconRegistry.addSvgIcon('google', this.domSanitizer.bypassSecurityTrustResourceUrl("assets/google-icon.svg"));

    this.authService.beforeLogout$.subscribe(options => {
      if (!options || options.emitEvent) this.pp.bye();
      this.ws.connected$.next(false);
    });

    this.authService.login$.subscribe(payload => this.pp.handshake(payload));
  }

  ngOnInit() {
    this.pp.events({
      handshake: ({ refreshToken, token }) => {
        window?.localStorage.setItem('token', token);
        window?.localStorage.setItem('refreshToken', refreshToken);
        this.ws.connected$.next(true);
      },
      user: user => this.authService.user$.next(user),
      users: users => this.store.dispatch(new Users.Fetch(users.map(([, v]) => v))),
      votings: votings => this.store.dispatch(new Votings.Fetch(votings.map(([, v]) => v))),
      voted: ({ userId, votingId, point }) => this.store.dispatch(new Votings.Vote(userId, votingId, point)),
      unvoted: ({ userId, votingId }) => this.store.dispatch(new Votings.Unvote(userId, votingId)),
      flip: voting => this.store.dispatch(new Votings.Flip(voting)),
      activateVoting: ({ votingId }) => this.store.dispatch(new Votings.Activate(votingId)),
      restartVoting: voting => this.store.dispatch(new Votings.Restart(voting)),
      newRoom: ({ roomId }) => this.router.navigate(['room', roomId]),
      notFound: () => this.router.navigate(['not-found'], { skipLocationChange: true }),
      denied: () => {
        this.router.navigate(['forbidden'], { skipLocationChange: true });
        this.authService.logout$.next();
      },
      invalidToken: () => this.authService.logout$.next({ emitEvent: false }),
      feedback: ({ success }) => {
        if (success) {
          this.snackBar.open('Большое спасибо за обратную связь!', undefined, { duration: 1000 });
        }
      },
      deleteRoom: () => {
        this.snackBar.open('Комната удалена, вы были перемещены на список комнат', 'Ну ок');
        this.router.navigate(["/"]);
      },
      googleAlreadyLinked: () => {
        this.snackBar.open('Данный google аккаунт уже привязан к пользователю.', 'Ну ок');
        this.router.navigate(["/"]);
      }
    }).subscribe();
  }
}

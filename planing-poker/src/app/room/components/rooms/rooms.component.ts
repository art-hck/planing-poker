import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ResolutionService } from '../../../app/services/resolution.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { Users } from '../../actions/users.actions';
import { Votings } from '../../actions/votings.actions';
import { RoomCreateComponent } from '../room-create/room-create.component';

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private store: Store,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService,
    public resolutionService: ResolutionService
  ) {
  }

  get isRoot() {
    return this.router.isActive("/", { fragment: 'exact', matrixParams: 'exact', paths: 'exact', queryParams: 'exact' });
  }

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());

    this.pp.events({
      users: users => this.store.dispatch(new Users.Fetch(users.map(([, v]) => v))),
      votings: votings => this.store.dispatch(new Votings.Fetch(votings.map(([, v]) => v))),
      voted: ({ userId, votingId, point }) => this.store.dispatch(new Votings.Vote(userId, votingId, point)),
      unvoted: ({ userId, votingId }) => this.store.dispatch(new Votings.Unvote(userId, votingId)),
      flip: voting => this.store.dispatch(new Votings.Flip(voting)),
      activateVoting: ({ votingId }) => this.store.dispatch(new Votings.Activate(votingId)),
      restartVoting: voting => this.store.dispatch(new Votings.Restart(voting)),
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  newRoom() {
    this.dialog.open(RoomCreateComponent, { autoFocus: false, width: '500px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name, points, canPreviewVotes, alias }) => name ? this.pp.newRoom(name, points, canPreviewVotes, alias) : null);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { HistoryService } from '../../../app/services/history.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ResolutionService } from '../../../app/services/resolution.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { Users } from '../../actions/users.actions';
import { Votings } from '../../actions/votings.actions';

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomsComponent implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();
  readonly activatedRouteFirstChild = activatedRouteFirstChild;

  constructor(
    private dialog: MatDialog,
    public router: Router,
    public route: ActivatedRoute,
    private store: Store,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService,
    public resolution: ResolutionService,
    public history: HistoryService,
  ) {}

  get isRoom() {
    return this.router.isActive("/room", { fragment: 'ignored', matrixParams: 'ignored', paths: 'subset', queryParams: 'ignored' });
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

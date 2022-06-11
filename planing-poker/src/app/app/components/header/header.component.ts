import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '@common/models';
import { filter } from 'rxjs';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { ResolutionService } from '../../services/resolution.service';
import { TitleService } from '../../services/title.service';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'pp-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() showPlayers = true;
  @Input() showVotings = true;
  @Output() showPlayersChange = new EventEmitter<boolean>();
  @Output() showVotingsChange = new EventEmitter<boolean>();

  readonly activatedRouteFirstChild = activatedRouteFirstChild;

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private pp: PlaningPokerWsService,
    public router: Router,
    public route: ActivatedRoute,
    public resolution: ResolutionService,
    public titleService: TitleService
  ) {}

  get isRoot() {
    return this.router.isActive('/', { fragment: 'exact', matrixParams: 'exact', paths: 'exact', queryParams: 'exact' });
  }

  verifications(user: User) {
    return {
      verified: user.verified,
      hasRole: !!user.role
    };
  }

  errorLength(user: User) {
    return Object.values(this.verifications(user)).filter(v => !v).length;
  }
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '@common/models';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { AuthService } from '../../services/auth.service';
import { HistoryService } from '../../services/history.service';
import { ResolutionService } from '../../services/resolution.service';
import { TitleService } from '../../services/title.service';

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
    public router: Router,
    public route: ActivatedRoute,
    public resolution: ResolutionService,
    public titleService: TitleService,
    public history: HistoryService
  ) {}

  get isRoot() {
    return !this.router.isActive("/room", { fragment: 'ignored', matrixParams: 'ignored', paths: 'subset', queryParams: 'ignored' });
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

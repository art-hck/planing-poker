import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '@common/models';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { AuthService } from '../../services/auth.service';
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
  @Output() back = new EventEmitter<void>();

  readonly activatedRouteFirstChild = activatedRouteFirstChild;

  constructor(
    public authService: AuthService,
    public router: Router,
    public route: ActivatedRoute,
    public resolution: ResolutionService,
    public titleService: TitleService
  ) {}

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

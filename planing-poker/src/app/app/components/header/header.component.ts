import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { User } from '@common/models';
import { filter } from 'rxjs';
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
  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private pp: PlaningPokerWsService,
    public router: Router,
    public resolution: ResolutionService,
    public titleService: TitleService
  ) {}

  get isRoot() {
    return this.router.isActive("/", { fragment: 'exact', matrixParams: 'exact', paths: 'exact', queryParams: 'exact' });
  }

  settings(user: User) {
    this.dialog.open(UserComponent, { width: '385px', data: { user }, autoFocus: false}).afterClosed().pipe(filter(v => v)).subscribe(payload => {
      const { name, role } = payload;
      this.pp.editUser(name, role);
    });
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

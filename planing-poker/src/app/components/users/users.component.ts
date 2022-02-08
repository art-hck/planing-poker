import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuthService } from "../auth/auth.service";
import { User, Uuid, Voting } from "@common/models";
import { RolesName } from "@common/models/role";

@Component({
  selector: 'pp-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  @Input() users?: (User & { voted?: boolean })[] | null;
  @Input() activeVoting?: Voting | null;
  @Input() showVotes = false;
  readonly teamRole = RolesName;

  constructor(public authService: AuthService) {
  }

  getVote(user: User): number | undefined {
    const votes = new Map<Uuid, number>(this.activeVoting?.votes as any as []);
    return votes.get(user.id);
  }

}

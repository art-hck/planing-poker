import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from "../auth/auth.service";
import { RolesName, User, Uuid, Voting } from "@common/models";
import { Colors } from "../../util/colors";

@Component({
  selector: 'pp-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnChanges {
  @Input() users?: User[] | null;
  @Input() activeVoting?: Voting<true> | null;

  readonly teamRole = RolesName;
  voteColors = new Map<number | null, string>();
  votes?: Map<Uuid, number | null>;

  constructor(public authService: AuthService) {}

  ngOnChanges(c: SimpleChanges) {
    if(c['activeVoting']) {
      this.votes = new Map<Uuid, number | null>(this.activeVoting?.votes);
      this.voteColors.clear();
      Array.from(new Set(this.votes.values())).sort().forEach(vote => this.voteColors.set(vote, Colors[this.voteColors.size]));
    }
  }

  isVoted(user: User): boolean {
    return this.votes?.get(user.id) !== undefined;
  }

  getUserInitials(user: User): string {
    return user.name.split(" ").map(n => n[0]).slice(0,2).join("");
  }

  stringToColor(string: string) {
    return Colors[string.split("").map(char => +char.charCodeAt(0)).reduce((a, b) => a + b, 0) % Colors.length];
  }

  trackByFn = (index: number, item: User) => item.id;
}

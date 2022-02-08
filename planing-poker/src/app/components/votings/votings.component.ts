import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Voting } from "@common/models";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'pp-votings',
  templateUrl: './votings.component.html',
  styleUrls: ['./votings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingsComponent {
  @Input() votings?: Voting<true>[]
  @Output() select = new EventEmitter<Voting<true>>();

  constructor(public authService: AuthService) {
  }

  trackByFn = (index: number, item: Voting<true>) => item.id;
}

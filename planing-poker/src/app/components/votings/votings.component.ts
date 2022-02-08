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
  @Input() votings?: Voting[]
  @Output() select = new EventEmitter<Voting>();

  constructor(public authService: AuthService) {
  }
}

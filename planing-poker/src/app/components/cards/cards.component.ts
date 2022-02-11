import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { merge } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { Voting } from "@common/models";
import { MatStepper } from "@angular/material/stepper";

@Component({
  selector: 'pp-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsComponent implements OnChanges {
  @ViewChild('stepper') stepper?: MatStepper;
  @Input() step?: number;
  @Input() activeVoting?: Voting<true> | null;

  readonly points = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40];
  active?: number;

  constructor(public pp: PlaningPokerWsService, private cd: ChangeDetectorRef, public authService: AuthService) {
  }

  ngOnChanges() {
    if (!this.activeVoting) {
      this.stepper?.reset()
    }
  }

  get selected() {
    return this.active !== undefined;
  }

  vote(point: number) {
    if(this.activeVoting) {
      if (this.active !== point) {
        this.active = point;
        this.pp.vote(this.activeVoting.id, point);
      } else {
        this.active = undefined;
        this.pp.unvote(this.activeVoting.id);
      }
    }
  }

  ngOnInit() {
    merge(this.pp.activateVoting$, this.pp.restartVoting$).subscribe(() => {
      this.active = undefined;
      this.cd.detectChanges();
    });
  }

  get groupedVotes(): [number, number][] {
    return Array.from(this.activeVoting?.votes.reduce((group, vote) => {
      if (vote[1] !== null) {
        group.set(vote[1], (group.get(vote[1]) ?? 0) + 1);
      }

      return group;
    }, new Map<number, number>()) || []).sort((a, b) => b[1] - a[1]);
  }

  get winner(): string {
    return this.groupedVotes.filter((v, i, [f]) => v[1] === f[1]).map(v => v[0]).join(" или ");
  }
}

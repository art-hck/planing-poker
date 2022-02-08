import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { map, repeatWhen, takeUntil, timer } from "rxjs";
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
export class CardsComponent {
  @ViewChild('stepper') stepper?: MatStepper;
  @Input() step?: number;
  @Input() avg: number | null = 0;
  @Input() votedCount: number | null = 0;
  @Input() activeVoting?: Voting | null;
  @Output() stepChange = new EventEmitter<number>();

  readonly points = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40];
  readonly vote$ = new EventEmitter<number>();
  readonly timer$ = timer(0, 1000).pipe(
    takeUntil(this.pp.flip$),
    repeatWhen(() => this.vote$),
    map(v => new Date(0).setSeconds(v))
  )
  active?: number;

  constructor(public pp: PlaningPokerWsService, private cd: ChangeDetectorRef, public authService: AuthService) {
  }

  get selected() {
    return this.active !== undefined;
  }

  reset() {
    this.active = undefined;
    this.pp.unvote(this.activeVoting!.id);
  }

  vote(point: number) {
    if (this.active !== point) {
      this.active = point;
      this.vote$.emit(point)
      this.pp.vote(point, this.activeVoting!.id);
    }
  }

  ngOnInit() {
    this.pp.endVoting$.subscribe(({ votingId }) => {
      this.stepper?.reset();
      this.active = undefined;
      this.cd.detectChanges();
    })
  }
}

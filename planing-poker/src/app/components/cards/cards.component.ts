import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { concatMap, range, Subject, takeUntil, timer } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { Room, RoomRole, Voting } from "@common/models";
import { MatStepper } from "@angular/material/stepper";
import * as confetti from "canvas-confetti";
import { CreateTypes as Confetti } from "canvas-confetti";

@Component({
  selector: 'pp-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsComponent implements OnChanges {
  @ViewChild('stepper') stepper?: MatStepper;
  @Input() step?: number;
  @Input() room?: Room<true>;
  @Input() activeVoting?: Voting<true> | null;
  @ViewChild('confettiCanvas') set confettiCanvas(el: ElementRef<HTMLCanvasElement>) {
    this.confetti = el ? confetti.create(el.nativeElement, {resize: true}) : undefined;
  };
  readonly roomRole = RoomRole;
  readonly points = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40];
  readonly destroy$ = new Subject<void>();
  active?: number;
  confetti?: Confetti;

  constructor(public pp: PlaningPokerWsService, private cd: ChangeDetectorRef, public authService: AuthService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.confetti && changes['activeVoting'] && changes['activeVoting'].previousValue?.id === changes['activeVoting'].currentValue?.id) {
      if (this.groupedVotes.length === 1 && this.groupedVotes[0][1] > 1) { // Если голоса в одной группе и их больше одного
        range(1, 10)
          .pipe(concatMap(() => timer(100 + (Math.random() * 700))), takeUntil(this.destroy$))
          .subscribe(() => this.confetti && this.confetti({
            particleCount: 100,
            spread: 90,
            angle: Math.random() * (45 - (135)) + (135),
            scalar: .7
          }));
      }
    }
  }

  get selected() {
    return this.active !== undefined;
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

  ngOnInit() {
    this.pp.events(['restartVoting', 'activateVoting']).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.active = undefined;
      this.cd.detectChanges();
    });
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Room, RoomRole, Voting } from '@common/models';
import * as confetti from 'canvas-confetti';
import { CreateTypes as Confetti } from 'canvas-confetti';
import { concatMap, filter, range, Subject, takeUntil, timer } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ConfirmComponent } from '../../../shared/component/confirm/confirm.component';

@Component({
  selector: 'pp-room-cards',
  templateUrl: './room-cards.component.html',
  styleUrls: ['./room-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomCardsComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('stepper') stepper?: MatStepper;
  @Input() step?: number | null;
  @Input() room?: Room<true>;
  @Input() activeVoting?: Voting<true> | null;

  @ViewChild('confettiCanvas') set confettiCanvas(el: ElementRef<HTMLCanvasElement>) {
    this.confetti = el ? confetti.create(el.nativeElement, { resize: true }) : undefined;
  }

  readonly roomRole = RoomRole;
  readonly destroy$ = new Subject<void>();
  active?: string;
  confetti?: Confetti;

  constructor(public pp: PlaningPokerWsService, private cd: ChangeDetectorRef, public authService: AuthService, private dialog: MatDialog) {
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
            scalar: .7,
          }));
      }
    }
  }

  get selected() {
    return this.active !== undefined;
  }

  get groupedVotes(): [string, number][] {
    return Array.from(this.activeVoting?.votes.reduce((group, vote) => {
      if (vote[1] !== null) {
        group.set(vote[1], (group.get(vote[1]) ?? 0) + 1);
      }

      return group;
    }, new Map<string, number>()) || []).sort((a, b) => b[1] - a[1]);
  }

  get winner(): string {
    return this.groupedVotes.filter((v, i, [f]) => v[1] === f[1]).map(v => v[0]).join(' или ');
  }

  ngOnInit() {
    this.pp.events(['restartVoting', 'activateVoting']).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.active = undefined;
      this.cd.detectChanges();
    });
  }

  vote(point: string) {
    if (this.activeVoting) {
      if (this.active !== point) {
        this.active = point;
        this.pp.vote(this.activeVoting.id, point);
      } else {
        this.active = undefined;
        this.pp.unvote(this.activeVoting.id);
      }
    }
  }

  restart() {
    const data = {
      title: 'Перезапустить голосование?',
      content: 'Отменить действие будет невозможно. Все текущие голоса будут удалены.',
      cancel: 'Отмена',
      submit: 'Перезапустить'
    };

    this.dialog.open(ConfirmComponent, { width: '360px', data, restoreFocus: false }).afterClosed().pipe(filter(Boolean))
      .subscribe(() => {
        if (this.activeVoting) this.pp.restartVoting(this.activeVoting?.id);
      });

  }

  flip() {
    if (this.room?.users && this.activeVoting?.votes && this.room?.users?.length > this.activeVoting?.votes?.length) {
      const data = {
        title: 'Еще не все проголосовали',
        content: 'В случае, если вы не хотите дожидаться можно открыть карты, либо переместить пользователя в наблюдатели.',
        cancel: 'Отмена',
        submit: 'Открыть карты'
      };

      this.dialog.open(ConfirmComponent, { width: '360px', data, restoreFocus: false }).afterClosed().pipe(filter(Boolean))
        .subscribe(() => {
          if (this.activeVoting) this.pp.flip(this.activeVoting?.id);
        });
    } else {
      if (this.activeVoting) this.pp.flip(this.activeVoting?.id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

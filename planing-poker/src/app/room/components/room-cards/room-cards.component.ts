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
import { Room, RoomRole, User, Voting } from '@common/models';
import * as confetti from 'canvas-confetti';
import { CreateTypes as Confetti } from 'canvas-confetti';
import { concatMap, filter, mapTo, range, Subject, switchMap, takeUntil, timer, withLatestFrom } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ConfirmComponent } from '../../../shared/component/confirm/confirm.component';

@Component({
  selector: 'pp-room-cards',
  templateUrl: './room-cards.component.html',
  styleUrls: ['./room-cards.component.scss', './room-cards-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomCardsComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('stepper') stepper?: MatStepper;
  @Input() users?: User[] | null;
  @Input() step?: number | null;
  @Input() room?: Room<true>;
  @Input() currentVoting?: Voting<true> | null;

  @ViewChild('confettiCanvas') set confettiCanvas(el: ElementRef<HTMLCanvasElement>) {
    el ? this.confetti$.next(confetti.create(el.nativeElement, { resize: true })) : undefined;
  }

  readonly roomRole = RoomRole;
  readonly destroy$ = new Subject<void>();
  readonly confetti$ = new Subject<Confetti>();
  readonly currentVotingEnd$ = new Subject<void>();
  readonly timer$ = timer(300).pipe(mapTo(true));
  active?: string;

  constructor(public pp: PlaningPokerWsService, private cd: ChangeDetectorRef, public authService: AuthService, private dialog: MatDialog) {
  }

  get selected() {
    return this.active !== undefined;
  }

  get groupedVotes(): [string, number][] {
    return Array.from(this.currentVoting?.votes.reduce((group, vote) => {
      if (vote[1] !== null) {
        group.set(vote[1], (group.get(vote[1]) ?? 0) + 1);
      }

      return group;
    }, new Map<string, number>()) || []).sort((a, b) => b[1] - a[1]);
  }

  get winner(): string {
    return this.groupedVotes.filter((v, i, [f]) => v[1] === f[1]).map(v => v[0]).join(' или ');
  }

  ngOnChanges(changes: SimpleChanges) {
    const prev: Voting<true> = changes['currentVoting']?.previousValue;
    const curr: Voting<true> = changes['currentVoting']?.currentValue;
    if (prev?.id === curr?.id && prev?.status !== 'end' && curr?.status === 'end') {
      this.currentVotingEnd$.next();
    }
  }

  ngOnInit() {
    this.pp.events(['restartVoting', 'activateVoting']).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.active = undefined;
      this.cd.detectChanges();
    });

    this.currentVotingEnd$.pipe(
      filter(() => this.groupedVotes.length === 1 && this.groupedVotes[0][1] > 1), // Если голоса в одной группе и их больше одного
      switchMap(() => range(1, 10)),
      concatMap(() => timer(100 + (Math.random() * 700))),
      withLatestFrom(this.confetti$),
      takeUntil(this.destroy$)
    ).subscribe(([, confetti]) => confetti({
      particleCount: 100,
      spread: 90,
      angle: Math.random() * (45 - (135)) + (135),
      scalar: .7,
    }));
  }

  vote(point: string) {
    if (this.currentVoting) {
      if (this.active !== point) {
        this.active = point;
        this.pp.vote(this.currentVoting.id, point);
      } else {
        this.active = undefined;
        this.pp.unvote(this.currentVoting.id);
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

    this.dialog.open(ConfirmComponent, { width: '360px', data }).afterClosed().pipe(filter(Boolean))
      .subscribe(() => {
        if (this.currentVoting) this.pp.restartVoting(this.currentVoting?.id);
      });

  }

  flip() {
    const usersLength = this.room?.users
      .filter(([id, role]) => this.users?.some(u => u.online && u.id === id) && role.indexOf(RoomRole.user) >= 0).length || 0;
    const votesLength = this.currentVoting?.votes.length || 0;

    if (usersLength > votesLength) {
      const data = {
        title: 'Еще не все проголосовали',
        content: 'В случае, если вы не хотите дожидаться можно открыть карты, либо переместить пользователя в наблюдатели.',
        cancel: 'Отмена',
        submit: 'Открыть карты'
      };

      this.dialog.open(ConfirmComponent, { width: '360px', data }).afterClosed().pipe(filter(Boolean))
        .subscribe(() => {
          if (this.currentVoting) this.pp.flip(this.currentVoting?.id);
        });
    } else {
      if (this.currentVoting) this.pp.flip(this.currentVoting?.id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

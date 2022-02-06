import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input } from '@angular/core';
import { map, repeatWhen, takeUntil, timer } from "rxjs";
import { WsService } from "../../services/ws.service";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'pp-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardsComponent {
  @Input() step = 1;
  @Input() avg: number = 0;
  @Input() votedCount: number = 0;

  readonly points = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40];
  readonly flip$ = new EventEmitter();
  readonly vote$ = new EventEmitter<number>();
  readonly timer$ = timer(0, 1000).pipe(
    takeUntil(this.flip$),
    repeatWhen(() => this.vote$),
    map(v => new Date(0).setSeconds(v))
  )
  active?: number;

  constructor(private wsService: WsService, private cd: ChangeDetectorRef, public authService: AuthService) {
  }

  get selected() {
    return this.active !== undefined;
  }

  reset() {
    this.active = undefined;
    this.step = 1;
    this.wsService.send('unvote', {}, { withCredentials: true })
  }

  endVoting() {
    this.wsService.send('endVoting', {}, { withCredentials: true })
  }

  flip() {
    this.wsService.send('flip', {}, { withCredentials: true });
  }

  vote(point: number) {
    if(this.active !== point) {
      this.active = point;
      this.vote$.emit(point)
      this.wsService.send('vote', { point }, { withCredentials: true })
    }
  }

  ngOnInit() {
    this.wsService.read('endVoting').subscribe(() => {
      this.active = undefined;
      this.step = 1;
      this.cd.detectChanges();
    })

    this.wsService.read('flip').subscribe(() => {
      this.step = 2;
      this.flip$.emit();
      this.cd.detectChanges();
    })
  }
}

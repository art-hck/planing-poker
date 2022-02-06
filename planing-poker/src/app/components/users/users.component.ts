import { ChangeDetectionStrategy, Component, Input, Output } from '@angular/core';
import { WsService } from "../../services/ws.service";
import { AuthService } from "../auth/auth.service";
import { Token, WsMessage } from "@common/models";
import { map, Observable, shareReplay, startWith, switchMap } from "rxjs";

@Component({
  selector: 'pp-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent {
  @Input() showVotes = false;
  readonly events$ = this.wsService.readMultiple(['voted', 'unvoted', 'flip', 'endVoting']);
  readonly users$ = this.wsService.read<Token[]>('users').pipe(
    switchMap((users: (Token & { voted?: boolean, vote?: number })[]) => {
      return this.events$.pipe(
        startWith(null),
        map((event: WsMessage | null) => {
          console.log(event);
          if (!event) return users;
          switch (event.action) {
            case 'unvoted':
            case 'voted':
              (() => {
                const payload = event.payload as { id: string };
                const user = users.find(u => u.id === payload.id);
                if (user) user.voted = event.action === 'voted';

                // // Chips
                // this.authService.user$.pipe(
                //   filter((u) => u?.id !== user?.id)
                // ).subscribe(u => {
                //   this.snackBar.open(`${user?.name} ${event.action === 'voted' ? 'проголосовал' : 'отменил голос'}`, 'Ну ок', {
                //     duration: 4000,
                //   });
                // })
              })()
              break;
            case 'flip':
              (() => {
                const payload = event.payload as { votes: [] }
                const votes = new Map<string, number>(payload.votes);
                users.forEach(user => user.vote = votes.get(user.id));
              })()
              break;
            case 'endVoting':
              users.forEach(user => {
                delete user.voted;
                delete user.vote;
              })
              break;
          }
          return users;
        })
      )
    }),
    shareReplay(1)
  );

  @Output() avg: Observable<number> = this.users$.pipe(
    map(users => users.reduce((total, u) => {
      return total + (u?.vote || 0)
    }, 0) / users.filter(u => u.vote).length)
  )

  @Output() votedCount: Observable<number> = this.users$.pipe(map(users => users.filter(u => u.voted).length))

  constructor(private wsService: WsService, public authService: AuthService) {}
}

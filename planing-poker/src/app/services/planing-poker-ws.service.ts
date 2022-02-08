import { Injectable } from '@angular/core';
import { WsService } from "./ws.service";
import { Handshake, Token, User, Uuid, Voting } from "@common/models";

@Injectable({
  providedIn: 'root'
})
export class PlaningPokerWsService {

  readonly handshake$ = this.ws.read<{ token: Token }>('handshake');
  readonly endVoting$ = this.ws.read<{ votingId: Uuid }>('endVoting');
  readonly flip$ = this.ws.read<Voting<true>>('flip');
  readonly users$ = this.ws.read<[Uuid, User][]>('users');
  readonly reject$ = this.ws.read('reject');
  readonly voted$ = this.ws.read<{ userId: Uuid, votingId: Uuid, point?: number }>('voted');
  readonly unvoted$ = this.ws.read<{ userId: Uuid, votingId: Uuid }>('unvoted');
  readonly votings$ = this.ws.read<[Uuid, Voting<true>][]>('votings');
  readonly activateVoting$ = this.ws.read<{ votingId: Uuid }>('activateVoting');

  constructor(private ws: WsService) {
  }

  handshake(payload: Handshake) {
    this.ws.send('handshake', payload!, { force: true });
    return this.handshake$;
  }

  bye(token: Token) {
    this.ws.send('bye', { token })
  }

  vote(point: number, votingId: Uuid) {
    this.ws.send('vote', { point, votingId }, { withCredentials: true })
  }

  unvote(votingId: Uuid) {
    this.ws.send('unvote', { votingId }, { withCredentials: true });
  }

  flip(votingId: Uuid) {
    this.ws.send('flip', { votingId }, { withCredentials: true });
  }

  activateVoting(votingId: Uuid) {
    this.ws.send('activateVoting', { votingId })
  }

  endVoting(votingId: Uuid) {
    this.ws.send('endVoting', { votingId }, { withCredentials: true });
  }
}

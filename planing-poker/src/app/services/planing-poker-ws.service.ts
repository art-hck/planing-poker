import { Injectable } from '@angular/core';
import { WsService } from "./ws.service";
import { Handshake, Uuid, WsAction, WsEvent } from "@common/models";
import { Observable } from "rxjs";

type Events = {
  [K in keyof WsEvent as K extends string ? `${K}$` : never]: Observable<WsEvent[K]>
} & Record<keyof WsAction, Function>;

@Injectable({
  providedIn: 'root'
})
export class PlaningPokerWsService implements Events {

  readonly handshake$ = this.ws.read('handshake');
  readonly restartVoting$ = this.ws.read('restartVoting');
  readonly flip$ = this.ws.read('flip');
  readonly users$ = this.ws.read('users');
  readonly voted$ = this.ws.read('voted');
  readonly unvoted$ = this.ws.read('unvoted');
  readonly votings$ = this.ws.read('votings');
  readonly activateVoting$ = this.ws.read('activateVoting');
  readonly reject$ = this.ws.read('reject');
  readonly denied$ = this.ws.read('denied');

  constructor(private ws: WsService) {
  }

  handshake(payload: Handshake) {
    this.ws.send('handshake', payload, { force: true });
    return this.handshake$;
  }

  bye() {
    this.ws.send('bye', {}, { withCredentials: true })
  }

  vote(votingId: Uuid, point: number) {
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

  restartVoting(votingId: Uuid) {
    this.ws.send('restartVoting', { votingId }, { withCredentials: true });
  }

  newVoting(name: string) {
    this.ws.send('newVoting', { name }, { withCredentials: true });
  }
}

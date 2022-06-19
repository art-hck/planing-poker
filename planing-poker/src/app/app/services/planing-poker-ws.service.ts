import { Injectable } from '@angular/core';
import { Handshake, Role, Room, RoomRole, Token, Uuid, WsAction, WsEvent } from '@common/models';
import { merge, Observable, shareReplay, tap } from 'rxjs';
import { WsService } from './ws.service';

type PlaningPokerWsServiceEventsType = { [K in keyof WsEvent as K extends string ? `${K}$` : never]: Observable<WsEvent[K]> };
type PlaningPokerWsServiceActionsType = Record<keyof WsAction, (...args: any[]) => unknown>;
type PlaningPokerWsServiceEventsArrType = { events: Partial<{ [K in keyof WsEvent]: (payload: WsEvent[K]) => any | (keyof WsEvent)[] }> };

type PlaningPokerWsServiceType = Partial<PlaningPokerWsServiceEventsType> & PlaningPokerWsServiceActionsType & PlaningPokerWsServiceEventsArrType;

@Injectable({
  providedIn: 'root'
})
export class PlaningPokerWsService implements PlaningPokerWsServiceType {

  readonly restartVoting$ = this.ws.read('restartVoting');
  readonly flip$ = this.ws.read('flip');
  readonly rooms$ = this.ws.read('rooms').pipe(shareReplay(1));
  readonly room$ = this.ws.read('room');
  readonly roomShared$ = this.room$.pipe(shareReplay(1));
  readonly leaveRoom$ = this.ws.read('leaveRoom');
  readonly checkAlias$ = this.ws.read('checkAlias');
  readonly requireRoomPassword$ = this.ws.read('requireRoomPassword');

  events(events: PlaningPokerWsServiceEventsArrType['events'] | (keyof WsEvent)[]) {
    return merge(...(Array.isArray(events) ? events.map(e => this.ws.read(e)) : Object.entries(events).map(([e, fn]) => this.ws.read(e as keyof WsEvent).pipe(tap(d => fn(d as any))))));
  }

  constructor(private ws: WsService) {
  }

  handshake(payload: Handshake) {
    this.ws.send('handshake', payload, { force: true });
  }

  bye() {
    this.ws.send('bye', {});
  }

  linkGoogle(token: Token, googleCode: string, googleRedirectUri: string) {
    this.ws.send('linkGoogle', { token, googleCode, googleRedirectUri }, { force: true });
  }

  sendCode(email: string) {
    return this.ws.send('sendCode', { email }, { force: true });
  }

  vote(votingId: Uuid, point: string) {
    this.ws.send('vote', { point, votingId });
  }

  unvote(votingId: Uuid) {
    this.ws.send('unvote', { votingId });
  }

  flip(votingId: Uuid) {
    this.ws.send('flip', { votingId });
  }

  activateVoting(votingId: Uuid) {
    this.ws.send('activateVoting', { votingId });
  }

  restartVoting(votingId: Uuid) {
    this.ws.send('restartVoting', { votingId });
  }

  newVoting(roomId: Uuid, names: string[]) {
    this.ws.send('newVoting', { names, roomId });
  }

  newRoom(name: string, points: string[], canPreviewVotes: RoomRole[], alias: string, password?: string) {
    this.ws.send('newRoom', { name, points, canPreviewVotes, alias, password });
  }

  joinRoom(roomId: Uuid, password?: string) {
    this.ws.send('joinRoom', { roomId, password });
  }

  disconnectRoom(roomId: Uuid) {
    this.ws.send('disconnectRoom', { roomId });
  }

  deleteVoting(votingId: Uuid) {
    this.ws.send('deleteVoting', { votingId });
  }

  editVoting(votingId: Uuid, name: string) {
    this.ws.send('editVoting', { votingId, name });
  }

  rooms() {
    this.ws.send('rooms', {});
  }

  setRole(userId: Uuid, roomId: Uuid, role: RoomRole) {
    this.ws.send('setRole', { userId, role, roomId });
  }

  feedback(subject: string, message: string) {
    this.ws.send('feedback', { subject, message });
  }

  deleteRoom(roomId: Uuid) {
    this.ws.send('deleteRoom', { roomId });
  }

  updateRoom(room: Room<true>, password?: string) {
    this.ws.send('updateRoom', { room, password });
  }

  leaveRoom(roomId: Uuid, userId?: Uuid) {
    this.ws.send('leaveRoom', { roomId, userId });
  }

  editUser(name: string, role: Role) {
    this.ws.send('editUser', { name, role });
  }

  checkAlias(alias: string) {
    this.ws.send('checkAlias', { alias });
  }
}

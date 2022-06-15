import * as uuid from 'uuid';
import { Uuid, Voting } from '../../../common/models';
import { NotFoundError } from '../errors/not-found-error';
import { RoutePayload } from '../models';
import { roomRepo, votingRepo } from '../mongo';

export class VotingController {
  /**
   * Проголосовать
   */
  static vote({ payload: { point, votingId }, broadcast, userId }: RoutePayload<'vote'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!room || !voting) throw new NotFoundError(`room or voting by votingId: ${votingId}`);

    const payloadFn = (id: Uuid) => (votingRepo.canViewVotes(room.id, id) ? { userId, votingId, point } : { userId, votingId });
    votingRepo.vote(voting, userId, point).then(() => broadcast('voted', payloadFn, room.id));
  }

  /**
   * Отменить голос
   */
  static unvote({ payload: { votingId }, broadcast, userId }: RoutePayload<'unvote'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!room || !voting) throw new NotFoundError(`room or voting by votingId: ${votingId}`);

    votingRepo.unvote(voting, userId).then(() => broadcast('unvoted', { userId, votingId }, room.id));
  }

  /**
   * Перезапустить голосование
   */
  static restart({ payload: { votingId }, broadcast, userId }: RoutePayload<'restartVoting'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!room || !voting) throw new NotFoundError(`room or voting by votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.restart(voting).then(() => broadcast('restartVoting', voting, room.id));
  }

  /**
   * Открытьь карты
   */
  static flip({ payload: { votingId }, broadcast, userId }: RoutePayload<'flip'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!room || !voting) throw new NotFoundError(`room or voting by votingId: ${votingId}`);

    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.flip(voting).then(() => broadcast('flip', voting, room.id));
  }

  /**
   * Создать голосования
   */
  static create({ payload: { roomId, names }, broadcast, userId }: RoutePayload<'newVoting'>) {
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    roomRepo.verifyAdmin(room.id, userId);
    const votings = names
      .map(name => name.trim())
      .filter(Boolean)
      .map(name => ({ id: uuid.v4(), name: name, votes: new Map(), status: 'pristine' } as Voting));

    votingRepo.createMultiple(votings, room).then(() => {
      broadcast('votings', id => votingRepo.list(room.id, id), room.id);
    });
  }

  /**
   * Удалить голосование
   */
  static delete({ payload: { votingId }, broadcast, userId }: RoutePayload<'deleteVoting'>) {
    const room = roomRepo.getByVotingId(votingId);
    if (!room) throw new NotFoundError(`room by votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.delete(votingId).then(() => broadcast('votings', userId => votingRepo.list(room.id, userId), room.id));
  }

  /**
   * Изменить голосование
   */
  static edit({ payload: { votingId, name }, broadcast, userId }: RoutePayload<'editVoting'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!voting || !room) throw new NotFoundError(`roomId: ${room?.id} or votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);
    voting.name = name;
    votingRepo.update(voting).then(() => broadcast('votings', userId => votingRepo.list(room.id, userId), room.id));
  }

  /**
   * Активировать голосование
   */
  static activate({ payload: { votingId }, broadcast, userId }: RoutePayload<'activateVoting'>) {
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!voting || !room) throw new NotFoundError(`roomId: ${room?.id} or votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.activate(room, voting).then(() => broadcast('activateVoting', { votingId }, room.id));
  }
}

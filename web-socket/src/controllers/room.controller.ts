import { NotFoundError } from '../errors/not-found-error';
import { RoutePayload } from '../models';
import { InvalidParamsError } from '../errors/invalid-params-error';
import { LimitsError } from '../errors/limits-error';
import { limitsRepo, roomPasswordRepo, roomRepo, usersRepo, votingRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { broadcast } from '../utils/broadcast';
import { replacer } from '../utils/set-map-utils';

export class RoomController {
  /**
   * Присоединиться к комнате
   */
  static async join({ payload: { roomId, password }, send, broadcast, userId, ws }: RoutePayload<'joinRoom'>) {
    const room = roomRepo.get(roomId);

    if (!room) {
      send('notFound', {});
      throw new NotFoundError(`roomId: ${roomId}`);
    }
    const sendAvailableRooms = !room.users.has(userId);

    await roomRepo.join(room, userId, ws, password).then(async () => {
      send('votings', votingRepo.list(room.id, userId));
      if (room.activeVotingId && votingRepo.votings.has(room.activeVotingId)) {
        send('activateVoting', { votingId: room.activeVotingId });
      }
      broadcast('room', room, room.id);
      broadcast('users', await usersRepo.list(room.id), room.id);

      if (sendAvailableRooms) {
        send('rooms', roomRepo.availableRooms(userId));
      }
    });
  }

  /**
   * Отключиться от комнаты
   */
  static async disconnect({ payload: { roomId }, broadcast, userId, ws }: RoutePayload<'disconnectRoom'>) {
    connections.disconnectUser(roomId, userId, ws);

    if (!connections.isConnected(roomId, userId)) {
      broadcast('users', await usersRepo.list(roomId), roomId);
    }
  }

  /**
   * Выйти из комнаты
   */
  static async leave({ payload: { roomId, userId }, userId: selfUserId, broadcast }: RoutePayload<'leaveRoom'>) {
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    if (userId) roomRepo.verifyAdmin(room.id, selfUserId);
    const uid = userId ?? selfUserId;

    const userConnections = connections.getByUser(uid);

    roomRepo.leave(room, uid).then(async () => {
      broadcast('users', await usersRepo.list(roomId), roomId);
      userConnections?.forEach(c => c.send(JSON.stringify({ event: 'leaveRoom', payload: { roomId: room.id } }, replacer)));
    });
  }

  /**
   * Создать комнату
   */
  static async create({ payload: { name, points, alias, canPreviewVotes, password }, send, userId }: RoutePayload<'newRoom'>) {
    if (points.length < 2) throw new InvalidParamsError(`points: ${points}`);

    const limits = await limitsRepo.find(userId);
    if (roomRepo.ownRooms(userId).length >= limits.maxRooms) throw new LimitsError({ maxRooms: limits.maxRooms });

    await roomRepo.create(name, userId, points, canPreviewVotes, alias || null, password).then(room => {
      send('newRoom', { roomId: room.alias || room.id });
      send('rooms', roomRepo.availableRooms(userId));
    });
  }

  /**
   * Изменить комнату
   */
  static update({ payload, send, userId }: RoutePayload<'updateRoom'>) {
    const room = roomRepo.get(payload.room.id);
    if (!room) {
      send('notFound', {});
      throw new NotFoundError(`roomId: ${payload.room.id}`);
    }
    roomRepo.verifyAdmin(payload.room.id, userId);

    room.name = payload.room.name;
    room.alias = payload.room.alias;
    room.canPreviewVotes = payload.room.canPreviewVotes;
    room.points = payload.room.points;
    room.private = !!payload.password;

    if (payload.password) {
      roomPasswordRepo.create(room.id, payload.password);
    } else {
      roomPasswordRepo.delete(room.id);
    }

    roomRepo.update(room).then(room => {
      send('rooms', roomRepo.availableRooms(userId));
      broadcast('room', room, room.id);
    });
  }

  static rooms({ send, userId }: RoutePayload<'rooms'>) {
    send('rooms', roomRepo.availableRooms(userId));
  }

  static delete({ payload: { roomId }, send, userId }: RoutePayload<'deleteRoom'>) {
    roomRepo.verifyAdmin(roomId, userId);
    broadcast('deleteRoom', {}, roomId);

    roomRepo.delete(roomId).then(() => {
      send('rooms', roomRepo.availableRooms(userId));
    });
  }

  static checkAlias({ payload: { alias }, send }: RoutePayload<'checkAlias'>) {
    roomRepo.checkAlias(alias).then(success => {
      send('checkAlias', { success });
    });
  }
}

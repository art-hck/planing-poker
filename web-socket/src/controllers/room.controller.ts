import { NotFoundError, RoutePayload } from '../models';
import { InvalidParamsError } from '../models/invalid-params-error';
import { roomRepo, usersRepo, votingRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { broadcast } from '../utils/broadcast';
import { replacer } from '../utils/set-map-utils';

export class RoomController {
  /**
   * Присоединиться к комнате
   */
  static async join({ payload: { roomId }, send, broadcast, userId, ws }: RoutePayload<'joinRoom'>) {
    const room = roomRepo.get(roomId);

    if (!room) {
      send('notFound', {});
      throw new NotFoundError(`roomId: ${roomId}`);
    }
    const sendAvailableRooms = !room.users.has(userId);

    await roomRepo.join(room, userId, ws).then(async () => {
      send('votings', votingRepo.list(roomId, userId));
      if (room.activeVotingId && votingRepo.votings.has(room.activeVotingId)) {
        send('activateVoting', { votingId: room.activeVotingId });
      }
      broadcast('room', room, roomId);
      broadcast('users', await usersRepo.list(roomId), roomId);

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
    if (userId) roomRepo.verifyAdmin(roomId, selfUserId);
    const uid = userId ?? selfUserId;

    const userConnections = connections.getByUser(uid);

    roomRepo.leave(room, uid).then(async () => {
      broadcast('users', await usersRepo.list(roomId), roomId);
      userConnections?.forEach(c => c.send(JSON.stringify({ event: 'leaveRoom', payload: { roomId } }, replacer)));
    });
  }

  /**
   * Создать комнату
   */
  static create({ payload: { name, points, canPreviewVotes }, send, userId }: RoutePayload<'newRoom'>) {
    if (points.length < 2) throw new InvalidParamsError(`points: ${points}`);
    roomRepo.create(name, userId, points, canPreviewVotes).then(roomId => {
      send('newRoom', { roomId });
      send('rooms', roomRepo.availableRooms(userId));
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
}

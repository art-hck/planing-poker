import { NotFoundError, RoutePayload } from '../models';
import { roomRepo, usersRepo, votingRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { broadcast } from '../utils/broadcast';

export class RoomController {
  /**
   * Присоединиться к комнате
   */
  static join({ payload: { roomId }, send, broadcast, userId, ws }: RoutePayload<'joinRoom'>) {
    const room = roomRepo.get(roomId);

    if (!room) {
      send('notFound', {});
      throw new NotFoundError(`roomId: ${roomId}`);
    }

    roomRepo.join(room, userId, ws).then(() => {
      send('votings', votingRepo.list(roomId, userId));
      if (room.activeVotingId && votingRepo.votings.has(room.activeVotingId)) {
        send('activateVoting', { votingId: room.activeVotingId });
      }
      broadcast('room', room, roomId);
      broadcast('users', usersRepo.list(roomId), roomId);
    });
  }

  /**
   * Отключиться от комнаты
   */
  static disconnect({ payload: { roomId }, broadcast, userId, ws }: RoutePayload<'disconnectRoom'>) {
    connections.disconnectUser(roomId, userId, ws);

    if (!connections.isConnected(roomId, userId)) {
      broadcast('users', usersRepo.list(roomId), roomId);
    }
  }

  /**
   * Выйти от комнаты
   */
  static leave({ payload: { roomId }, send, userId }: RoutePayload<'leaveRoom'>) {
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    roomRepo.leave(room, userId).then(() => send('rooms', roomRepo.availableRooms(userId)));
  }

  /**
   * Создать комнату
   */
  static create({ payload: { name }, send, userId }: RoutePayload<'newRoom'>) {
    roomRepo.create(name, userId).then(roomId => {
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

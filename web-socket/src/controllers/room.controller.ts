import * as uuid from 'uuid';
import { NotFoundError, RoutePayload } from '../models';
import { roomRepo, usersRepo, votingRepo } from '../mongo';
import { connections } from '../repository/connections.repository';

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
   * Покинуть комнату
   */
  static leave({ payload: { roomId }, broadcast, userId, ws }: RoutePayload<'leaveRoom'>) {
    const room = roomRepo.rooms.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    connections.disconnectUser(room.id, userId, ws);
    if (!connections.isConnected(room.id, userId)) {
      broadcast('users', usersRepo.list(room.id), room.id);
    }
  }

  /**
   * Создать комнату
   */
  static create({ payload: { name }, send, userId }: RoutePayload<'newRoom'>) {
    const roomId = uuid.v4();

    roomRepo.create(roomId, name, userId).then(() => {
      send('newRoom', { roomId });
      send('rooms', roomRepo.availableRooms(userId));
    });
  }

  static rooms({ send, userId }: RoutePayload<'rooms'>) {
    send('rooms', roomRepo.availableRooms(userId));
  }
}

import { NotFoundError, RoutePayload } from '../models';
import { roomRepo } from '../mongo';

export class UserController {
  static setRole({ payload: { roomId, userId, role }, userId: ownUserId, broadcast }: RoutePayload<'setRole'>) {
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    roomRepo.verifyAdmin(room.id, ownUserId);

    roomRepo.setRole(room, userId, role).then(() => broadcast('room', room, room.id));
  }
}

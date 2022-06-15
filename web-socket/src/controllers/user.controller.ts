import { NotFoundError } from '../errors/not-found-error';
import { RoutePayload } from '../models';
import { roomRepo, usersRepo } from '../mongo';
import { connections } from '../repository/connections.repository';

export class UserController {

  /**
   * Редактирование пользователя
   */
  static async edit(r: RoutePayload<'editUser'>) {
    const { payload: { name, role }, userId, broadcast, send } = r;
    let user = await usersRepo.find(userId);
    if (!user) throw new NotFoundError(`UserId: ${userId}`);
    user = { ...user, name, role };

    usersRepo.update(user).then(() => user && send('user', user));

    await roomRepo.rooms.forEach(async room => {
      if (!connections.get(room.id)?.has(userId)) return;
      broadcast('users', await usersRepo.list(room.id), room.id);
    });
  }

  /**
   * Задать роль пользователю
   *
   * @param roomId
   * @param userId
   * @param role
   * @param ownUserId
   * @param broadcast
   */
  static setRole({ payload: { roomId, userId, role }, userId: ownUserId, broadcast }: RoutePayload<'setRole'>) {
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    roomRepo.verifyAdmin(room.id, ownUserId);

    roomRepo.setRole(room, userId, role).then(() => broadcast('room', room, room.id));
  }
}

import { User } from '../../../common/models';
import { Config } from '../config';
import { NotFoundError, RoutePayload } from '../models';
import { DeniedError } from '../models/denied-error.ts';
import { googleRepo, refreshTokenRepo, roomRepo, usersRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { GoogleAccount } from '../repository/google.repository';
import { jwtSign, verifyToken } from '../utils/token-utils';

export class AuthController {
  /**
   * Логин + регистрация
   */
  static async handshake(r: RoutePayload<'handshake'>) {
    const { payload, session, userId, send } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { name, role, password, googleCode, token, refreshToken } = payload;
    let user: User | undefined;
    let googleAccount: GoogleAccount;
    switch (true) {
      case !!name:
        if (password && password !== '123123') throw new DeniedError();
        user = await usersRepo.register({ name, role, su: !!password, verified: false });
        break;
      case !!googleCode:
        googleAccount = await googleRepo.get(googleCode);
        user =
          (await googleRepo.getLinkedUser(googleAccount.id)) || // Пытаемся получить связанного пользователя
          (await usersRepo.find(userId)) || // Или несвязанного
          (await usersRepo.register({ name: googleAccount.name, su: false, verified: true })); // Тогда регаем

        await googleRepo.register(googleAccount, user.id); // Сохраняем гугл аккаунт, если еще нет
        break;
    }

    session.token = token ?? (user ? jwtSign({ id: user.id }, jwtSecret, jwtExp) : session.token);
    session.refreshToken = refreshToken ?? (user ? jwtSign({ id: user.id }, jwtRtSecret, jwtRtExp) : session.refreshToken);

    const id = verifyToken(r, true);

    usersRepo.find(id).then(user => user && send('user', user));
  }

  /**
   * Логаут + удаление временного аккаунта
   */
  static async bye({ broadcast, userId, session }: RoutePayload<'bye'>) {
    const user = await usersRepo.find(userId);
    roomRepo.rooms.forEach(room => {
      if (connections.isConnected(room.id, userId)) {
        connections.disconnectUser(room.id, userId);
        broadcast('users', usersRepo.list(room.id), room.id);
      }

      // Удалять из комнаты только временные аккаунты
      if (user && !user.verified) {
        usersRepo.delete(userId);
        roomRepo.leave(room, userId);
      }
    });

    session.refreshToken && refreshTokenRepo.delete(session.refreshToken);
  }

  /**
   * Привязка google-аккаунта к уже существующему пользователю
   */
  static async linkGoogle(r: RoutePayload<'linkGoogle'>) {
    const { payload, userId, send } = r;
    const { googleCode } = payload;
    const user = await usersRepo.find(userId);
    const googleAccount: GoogleAccount = await googleRepo.get(googleCode);

    if (!user) throw new NotFoundError(`UserId: ${userId}`);

    if (await googleRepo.register(googleAccount, user.id)) {
      user.verified = true;
      usersRepo.update(user).then(() => user && send('user', user));
    } else {
      send('googleAlreadyLinked', {});
    }
  }

  /**
   * Редактирование пользователя
   */
  static async edit(r: RoutePayload<'editUser'>) {
    const { payload: { name, role }, userId, broadcast, send } = r;
    let user = await usersRepo.find(userId);
    if (!user) throw new NotFoundError(`UserId: ${userId}`);
    user = { ...user, name, role };

    usersRepo.update(user).then(() => user && send('user', user));

    roomRepo.rooms.forEach(room => {
      if (!connections.get(room.id)?.has(userId)) return;
      broadcast('users', usersRepo.list(room.id), room.id);
    });
  }
}

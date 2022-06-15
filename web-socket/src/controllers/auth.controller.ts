import { JsonWebTokenError } from 'jsonwebtoken';
import { Room, User } from '../../../common/models';
import { Config } from '../config';
import { NotFoundError } from '../errors/not-found-error';
import { RoutePayload } from '../models';
import { DeniedError } from '../errors/denied-error';
import { emailRepo, googleRepo, refreshTokenRepo, roomRepo, usersRepo } from '../mongo';
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
    const { name, role, password, googleCode, email, emailCode, token, refreshToken } = payload;
    let user: User | undefined;
    if (password && password !== '123123') throw new DeniedError();

    // Пробуем найти пользователя, если нет то регаем нового
    const findOrRegister = async (name: string, verified = true) => {
      return (await usersRepo.find(userId)) || (await usersRepo.register({ name, role, su: !!password, verified }));
    };

    if (email && emailCode) {
      user = (await emailRepo.getLinkedUser(email)) || (await findOrRegister( name || email));
      await emailRepo.link(email, emailCode, user.id); // Связываем почту и пользователя, если еще нет
    } else if (googleCode) {
      const googleAccount = await googleRepo.get(googleCode);
      user = (await googleRepo.getLinkedUser(googleAccount.id)) || (await findOrRegister( googleAccount.name));

      await googleRepo.register(googleAccount, user.id); // Сохраняем гугл аккаунт, если еще нет
    } else if (name) {
      user = await findOrRegister(name, false);
    }

    session.token = token ?? (user ? jwtSign({ id: user.id }, jwtSecret, jwtExp) : session.token);
    session.refreshToken = refreshToken ?? (user ? jwtSign({ id: user.id }, jwtRtSecret, jwtRtExp) : session.refreshToken);

    const id = verifyToken(r, true);

    await usersRepo.find(id).then(user => {
      if (user) send('user', user);
      else throw new JsonWebTokenError('');
    });
  }

  /**
   * Логаут + удаление временного аккаунта
   */
  static async bye({ broadcast, userId, session }: RoutePayload<'bye'>) {
    const user = await usersRepo.find(userId);
    await roomRepo.rooms.forEach(async (room: Room) => {
      if (connections.isConnected(room.id, userId)) {
        connections.disconnectUser(room.id, userId);
        broadcast('users', await usersRepo.list(room.id), room.id);
      }

      // Удалять из комнаты только временные аккаунты
      if (user && !user.verified) {
        usersRepo.delete(userId);
        roomRepo.leave(room, userId);
      }
    });

    session.refreshToken && await refreshTokenRepo.delete(session.refreshToken);

    delete session.token;
    delete session.refreshToken;
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

  static async verifyEmail(r: RoutePayload<'verifyEmail'>) {
    emailRepo.verify(r.payload.email);
  }
}

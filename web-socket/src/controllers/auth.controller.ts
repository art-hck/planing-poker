import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { User } from '../../../common/models';
import { Config } from '../config';
import { RoutePayload } from '../models';
import { DeniedError } from '../models/denied-error.ts';
import { googleRepo, refreshTokenRepo, roomRepo, telegramRepo, usersRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { GoogleAccount } from '../repository/google.repository';
import { verifyToken } from '../utils/token-utils';

export class AuthController {
  /**
   * Логин + регистрация
   */
  static async handshake(r: RoutePayload<'handshake'>) {
    const { payload, session } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { name, role, password, telegramCode, googleCode, token, refreshToken } = payload;
    let user: User | undefined;
    let isNew = false;
    let googleAccount: GoogleAccount;
    switch (true) {
      case !!name:
        if (password && password !== '123123') throw new DeniedError();
        user = (isNew = true) && { id: uuid.v4(), name, role, su: !!password };
        break;
      case !!googleCode:
        googleAccount = await googleRepo.userInfo(googleCode);
        user = (await googleRepo.getLinkedUser(googleAccount.id)) || ((isNew = true) && { id: uuid.v4(), name: googleAccount.name, su: false });
        await googleRepo.register(googleAccount, user.id);
        break;
      case !!telegramCode:
        user = await telegramRepo.getUser(telegramCode);
        break;
    }

    session.token = token ?? (user ? jwt.sign({ user }, jwtSecret, { expiresIn: jwtExp }) : session.token);
    session.refreshToken = refreshToken ?? (user ? jwt.sign({ user }, jwtRtSecret, { expiresIn: jwtRtExp }) : session.refreshToken);
    user = verifyToken(r, true);

    isNew ? usersRepo.create(user) : usersRepo.set(user);
  }

  /**
   * Логаут + удаление аккаунта
   */
  static bye({ broadcast, userId, session }: RoutePayload<'bye'>) {
    roomRepo.rooms.forEach(room => {
      broadcast('bye', {}, room.id, userId); // Отправляем на все соединени пользователя событие разлогина

      if (connections.isConnected(room.id, userId)) {
        connections.disconnectUser(room.id, userId);
        broadcast('users', usersRepo.list(room.id), room.id);
      }
    });

    session.refreshToken && refreshTokenRepo.delete(session.refreshToken);
  }

  /**
   * Связать пользователя с аккаунтом в телеграм
   */
  static linkTelegram({ payload: { code }, userId, send }: RoutePayload<'linkTelegram'>) {
    telegramRepo.link(userId, code).then(e => send('linkTelegram', { success: e?.matchedCount !== 0 }));
  }
}

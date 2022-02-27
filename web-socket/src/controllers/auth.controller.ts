import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { User } from '../../../common/models';
import { Config } from '../config';
import { NotFoundError, RoutePayload } from '../models';
import { DeniedError } from '../models/denied-error.ts';
import { googleRepo, refreshTokenRepo, roomRepo, usersRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { GoogleAccount } from '../repository/google.repository';
import { verifyToken } from '../utils/token-utils';

export class AuthController {
  /**
   * Логин + регистрация
   */
  static async handshake(r: RoutePayload<'handshake'>) {
    const { payload, session, userId } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { name, role, password, googleCode, token, refreshToken } = payload;
    let user: User | undefined;
    let isNew = false;
    let googleAccount: GoogleAccount;
    switch (true) {
      case !!name:
        if (password && password !== '123123') throw new DeniedError();
        user = (isNew = true) && { id: uuid.v4(), name, role, su: !!password, verifed: false };
        break;
      case !!googleCode:
        googleAccount = await googleRepo.get(googleCode);
        user = await googleRepo.getLinkedUser(googleAccount.id) || await usersRepo.find(userId);
        isNew = !user;
        user = user ?? { id: uuid.v4(), name: googleAccount.name, su: false, verifed: true };
        await googleRepo.register(googleAccount, user.id);
        break;
    }

    session.token = token ?? (user ? jwt.sign({ user }, jwtSecret, { expiresIn: jwtExp }) : session.token);
    session.refreshToken = refreshToken ?? (user ? jwt.sign({ user }, jwtRtSecret, { expiresIn: jwtRtExp }) : session.refreshToken);
    user = verifyToken(r, true);

    isNew ? usersRepo.create(user) : usersRepo.set(user);
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
      if (user && !user.verifed) {
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
    const { payload, session, userId, send } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { googleCode } = payload;
    const user = await usersRepo.find(userId);
    const googleAccount: GoogleAccount = await googleRepo.get(googleCode);

    if (!user) throw new NotFoundError(`UserId: ${userId}`);
    if (await googleRepo.register(googleAccount, user.id)) {
      user.verifed = true;
      session.token = jwt.sign({ user }, jwtSecret, { expiresIn: jwtExp });
      session.refreshToken = jwt.sign({ user }, jwtRtSecret, { expiresIn: jwtRtExp });
      verifyToken(r, true);
      usersRepo.update(user);
    } else {
      send('googleAlreadyLinked', {});
    }
  }

  /**
   * Редактирование пользователя
   */
  static editUser(r: RoutePayload<'editUser'>) {
    const { payload: { name, role }, session, userId, broadcast } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    let user = usersRepo.get(userId);
    if (!user) throw new NotFoundError(`UserId: ${userId}`);
    user = {...user, name, role};
    session.token = jwt.sign({ user }, jwtSecret, { expiresIn: jwtExp });
    session.refreshToken = jwt.sign({ user }, jwtRtSecret, { expiresIn: jwtRtExp });
    verifyToken(r, true);
    usersRepo.update(user);
    roomRepo.rooms.forEach(room => {
      if(!connections.get(room.id)?.has(userId)) return;
      broadcast('users', usersRepo.list(room.id), room.id);
    });
  }
}

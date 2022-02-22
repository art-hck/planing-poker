import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import { Config } from '../config';
import { RoutePayload } from '../models';
import { DeniedError } from '../models/denied-error.ts';
import { roomRepo, usersRepo } from '../mongo';
import { connections } from '../repository/connections.repository';
import { verifyToken } from '../utils/token-utils';

export class AuthController {
  static handshake(r: RoutePayload<'handshake'>) {
    const { payload, session } = r;
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { name, role, password, token, refreshToken } = payload;

    if (password && password !== '123123') throw new DeniedError();

    const newUser = name && { id: uuid.v4(), name, role, su: !!password };

    session.token = token ?? (newUser ? jwt.sign(newUser, jwtSecret, { expiresIn: jwtExp }) : session.token);
    session.refreshToken = refreshToken ?? (newUser ? jwt.sign(newUser, jwtRtSecret, { expiresIn: jwtRtExp }) : session.refreshToken);

    verifyToken(r, true);
  }

  static bye({ broadcast, userId }: RoutePayload<'bye'>) {
    roomRepo.rooms.forEach(room => {
      broadcast('bye', {}, room.id, userId); // Отправляем на все соединени пользователя событие разлогина

      if (connections.hasUser(room.id, userId)) {
        connections.deleteUserConnections(room.id, userId);
        broadcast('users', usersRepo.list(room.id), room.id);
      }
    });
  }
}

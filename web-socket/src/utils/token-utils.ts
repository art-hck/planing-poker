import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Token, User, Uuid } from '../../../common/models';
import { Config } from '../config';
import { RoutePayload } from '../models';
import { refreshTokenRepo, usersRepo } from '../mongo';

export function verifyToken(r: RoutePayload, sendHandshake?: boolean) {
  const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
  const { send, session: s } = r;
  const rtRepo = refreshTokenRepo;
  let user: User;

  if (!s.token || !s.refreshToken) throw new JsonWebTokenError('');

  try {
    user = jwt.verify(s.token, jwtSecret) as User; // проверяем и декодируем токен
  } catch (e) {
    // Если токен протух, но есть рефреш токен который еще не использовался
    if (e instanceof TokenExpiredError && rtRepo.has(s.refreshToken)) {
      rtRepo.delete(s.refreshToken).then(); // использованый токен удаляем
      user = jwt.verify(s.refreshToken, jwtRtSecret) as User; // проверяем и декодируем рефреш токен
      delete user.iat;
      delete user.exp; // удаляем данные старого токена
      s.token = s.refreshToken = undefined; // удаляем данные клиента, т.к. ниже их нужно перезаписать
      sendHandshake = true;
    } else throw e;
  }

  s.token = s.token ?? jwt.sign(user, jwtSecret, { expiresIn: jwtExp });
  s.refreshToken = s.refreshToken ?? jwt.sign(user, jwtRtSecret, { expiresIn: jwtRtExp });

  rtRepo.create(s.refreshToken).then();

  usersRepo.users.set(user.id, user);

  if (sendHandshake) {
    send('handshake', { token: s.token, refreshToken: s.refreshToken });
  }
}

export function getUserId(token: Token): Uuid {
  const user = jwt.decode(token) as User;
  return user?.id;
}

import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Token, User, Uuid } from '../../../common/models';
import { Config } from '../config';
import { RoutePayload } from '../models';
import { TokenPayload } from '../models/token-payload';
import { refreshTokenRepo } from '../mongo';

export function verifyToken(r: RoutePayload, sendHandshake?: boolean): User {
  const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
  const { send, session: s } = r;
  const rtRepo = refreshTokenRepo;
  let tokenPayload: TokenPayload;

  if (!s.token || !s.refreshToken) throw new JsonWebTokenError('');

  try {
    tokenPayload = jwt.verify(s.token, jwtSecret) as TokenPayload; // проверяем и декодируем токен
  } catch (e) {
    // Если токен протух, но есть рефреш токен который еще не использовался
    if (e instanceof TokenExpiredError && rtRepo.has(s.refreshToken)) {
      rtRepo.delete(s.refreshToken).then(); // использованый токен удаляем
      tokenPayload = jwt.verify(s.refreshToken, jwtRtSecret) as TokenPayload; // проверяем и декодируем рефреш токен
      s.token = s.refreshToken = undefined; // удаляем данные клиента, т.к. ниже их нужно перезаписать
      sendHandshake = true;
    } else throw e;
  }

  if (!tokenPayload.user) {
    throw new JsonWebTokenError('');
  }

  s.token = s.token ?? jwt.sign({ user: tokenPayload.user }, jwtSecret, { expiresIn: jwtExp });
  s.refreshToken = s.refreshToken ?? jwt.sign({ user: tokenPayload.user }, jwtRtSecret, { expiresIn: jwtRtExp });

  rtRepo.create(s.refreshToken).then();

  if (sendHandshake) {
    send('handshake', { token: s.token, refreshToken: s.refreshToken });
  }

  return tokenPayload.user;
}

export function getUserId(token: Token): Uuid {
  return jwt.decode(token, { json: true })?.['user']?.id ?? ''; // Проверки на случай старого формата токена
}

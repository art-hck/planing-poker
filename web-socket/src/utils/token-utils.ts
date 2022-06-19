import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Token, User, Uuid } from '../../../common/models';
import { Config } from '../config';
import { RoutePayload, TokenPayload } from '../models';
import { refreshTokenRepo } from '../mongo';

export function verifyToken(r: RoutePayload, sendHandshake?: boolean): Uuid {
  const { secret, rt, exp } = Config.jwt;
  const { send, session: s } = r;
  const rtRepo = refreshTokenRepo;
  let id: User['id'] | undefined;

  if (!s.token || !s.refreshToken) throw new JsonWebTokenError('');

  try {
    id = jwtVerify(s.token, secret)?.id; // проверяем и декодируем токен
  } catch (e) {
    // Если токен протух, но есть рефреш токен который еще не использовался
    if (e instanceof TokenExpiredError && rtRepo.has(s.refreshToken)) {
      rtRepo.delete(s.refreshToken).then(); // использованый токен удаляем
      id = jwtVerify(s.refreshToken, rt.secret)?.id; // проверяем и декодируем рефреш токен
      s.token = s.refreshToken = undefined; // удаляем данные клиента, т.к. ниже их нужно перезаписать
      sendHandshake = true;
    } else throw e;
  }

  if (!id) {
    throw new JsonWebTokenError('');
  }

  s.token = s.token ?? jwtSign({ id }, secret, exp);
  s.refreshToken = s.refreshToken ?? jwtSign({ id }, rt.secret, rt.exp);

  rtRepo.create(s.refreshToken).then();

  if (sendHandshake) {
    send('handshake', { token: s.token, refreshToken: s.refreshToken });
  }

  return id;
}

export function jwtDecode(token: Token) {
  return jwt.decode(token) as TokenPayload | null;
}

export function jwtVerify(token: Token, secret: string) {
  return jwt.verify(token, secret) as TokenPayload | null;
}

export function jwtSign(payload: TokenPayload, secret: string, expiresIn?: string): Token {
  return jwt.sign(payload, secret, { expiresIn });
}

export function getUserId(token: Token): Uuid {
  return jwtDecode(token)?.id ?? '';
}

import { RoutePayload } from "../models";
import { Token, User, Uuid } from "../../../common/models";
import * as jwt from "jsonwebtoken";
import { TokenExpiredError } from "jsonwebtoken";
import { repository as repo } from "../repository";

export function verifyToken(r: RoutePayload<any>, sendHandshake?: boolean) {
  const { send, client: c } = r;
  const secret = process.env['JWT_SECRET'] || 'JWT_SECRET';
  const refreshSecret = process.env['JWT_RT_SECRET'] || 'JWT_RT_SECRET';
  const expiresIn = process.env['JWT_EXP'];
  const rtExpiresIn = process.env['JWT_RT_EXP'];
  let user: User;

  try {
    user = jwt.verify(c.token!, secret) as User; // проверяем и декодируем токен
  } catch (e) {
    // Если токен протух, но есть рефреш токен который еще не использовался
    if (e instanceof TokenExpiredError && c.refreshToken && repo.refreshTokens.has(c?.refreshToken)) {
      repo.refreshTokens.delete(c.refreshToken); // использованый токен удаляем
      user = jwt.verify(c.refreshToken, refreshSecret) as User; // проверяем и декодируем рефреш токен
      delete user.iat; delete user.exp; // удаляем данные старого токена
      c.token = c.refreshToken = undefined; // удаляем данные клиента, т.к. ниже их нужно перезаписать
      sendHandshake = true;
    } else throw e;
  }

  c.token = c.token ?? jwt.sign(user, secret, { expiresIn });
  c.refreshToken = c.refreshToken ?? jwt.sign(user, refreshSecret, { expiresIn: rtExpiresIn });
  repo.refreshTokens.add(c.refreshToken);
  repo.users.set(user.id, user);

  if(sendHandshake) {
    send('handshake', { token: c.token, refreshToken: c.refreshToken });
  }
}

export function getUserId(token: Token): Uuid {
  const user = jwt.decode(token) as User;
  return user.id;
}

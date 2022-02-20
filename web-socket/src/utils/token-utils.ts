import { RoutePayload } from "../models";
import { Token, User, Uuid } from "../../../common/models";
import * as jwt from "jsonwebtoken";
import { TokenExpiredError } from "jsonwebtoken";
import { refreshTokenRepo, usersRepo } from "../server";
import { Config } from "../config";

export function verifyToken(r: RoutePayload<any>, sendHandshake?: boolean) {
  const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
  const { send, client: c } = r;
  const rtRepo = refreshTokenRepo;
  let user: User;

  try {
    user = jwt.verify(c.token!, jwtSecret) as User; // проверяем и декодируем токен
  } catch (e) {
    // Если токен протух, но есть рефреш токен который еще не использовался
    if (e instanceof TokenExpiredError && c.refreshToken && rtRepo.refreshTokens.has(c?.refreshToken)) {
      rtRepo.delete(c.refreshToken); // использованый токен удаляем
      user = jwt.verify(c.refreshToken, jwtRtSecret) as User; // проверяем и декодируем рефреш токен
      delete user.iat; delete user.exp; // удаляем данные старого токена
      c.token = c.refreshToken = undefined; // удаляем данные клиента, т.к. ниже их нужно перезаписать
      sendHandshake = true;
    } else throw e;
  }

  c.token = c.token ?? jwt.sign(user, jwtSecret, { expiresIn: jwtExp });
  c.refreshToken = c.refreshToken ?? jwt.sign(user, jwtRtSecret, { expiresIn: jwtRtExp });

  rtRepo.add(c.refreshToken);

  usersRepo.users.set(user.id, user);

  if(sendHandshake) {
    send('handshake', { token: c.token, refreshToken: c.refreshToken });
  }
}

export function getUserId(token: Token): Uuid {
  const user = jwt.decode(token) as User;
  return user?.id;
}

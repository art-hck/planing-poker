import { Token, User, Uuid } from "@common/models";
import * as jwt from "jsonwebtoken";

export function getUserId(token: Token): Uuid {
  const user = jwt.decode(token) as User;
  return user?.id;
}

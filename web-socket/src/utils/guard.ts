import { Token, User, Uuid } from "@common/models";
import * as jwt from "jsonwebtoken";
import { repository } from "../repository";

export function guard({ token }: { token?: Token }, roomId?: Uuid) {
  const secret = process.env['SUPER_SECRET_STRING'] || 'SUPER_SECRET_STRING';
  const user = token ? jwt.verify(token, secret) as User : undefined;
  if (!token || !user || !roomId || (user?.role !== 'admin' && !repository.rooms.get(roomId)?.adminIds.has(user.id))) {
    throw new Error('denied');
  }
}

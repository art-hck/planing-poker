import { User, Uuid } from "@common/models";
import * as jwt from "jsonwebtoken";
import { getUserId } from "./get-user-id";
import { repository } from "../repository";

export function guard(token?: string, roomId?: Uuid) {
  const userId = token ? getUserId(token) : undefined;
  const user = token ? jwt.decode(token) as User : undefined;
  if (!token || !userId || !roomId || (user?.role !== 'admin' && !repository.rooms.get(roomId)?.adminIds.has(userId))) {
    throw new Error('denied');
  }
}

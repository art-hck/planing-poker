import { User, Uuid } from "../../../common/models";
import { roomRepo } from "../server";

export class UserRepository {
  readonly users = new Map<Uuid, User>();

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  list(roomId: Uuid): Map<Uuid, User> {
    const room = roomRepo.rooms.get(roomId);
    return new Map(Array.from(this.users.entries())
      .filter(([id]) => room && room.connections?.has(id))
      .map(([token, user]) => [token, user]));
  }
}

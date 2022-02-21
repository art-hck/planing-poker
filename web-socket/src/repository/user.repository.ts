import { User, Uuid } from "../../../common/models";
import { roomRepo } from "../mongo";
import { Collection } from "mongodb";
import { Repository } from "../models/repository";

export class UserRepository implements Repository<User> {
  readonly repositoryName = 'user';
  readonly users = new Map<Uuid, User>();
  collection?: Collection<User>;

  init(collection: Collection<User>) {
    this.collection = collection;
  }

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

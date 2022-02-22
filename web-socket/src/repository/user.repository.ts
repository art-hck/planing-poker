import { Collection } from 'mongodb';
import { User, Uuid } from '../../../common/models';
import { Repository } from '../models/repository';
import { connections } from './connections.repository';

export class UserRepository implements Repository<User> {
  readonly repositoryName = 'user';
  readonly users = new Map<Uuid, User>();
  private collection?: Collection<User>;

  init(collection: Collection<User>) {
    this.collection = collection;
  }

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  list(roomId: Uuid): Map<Uuid, User> {
    return new Map(
      Array.from<[Uuid, User]>(this.users.entries())

        .filter(([id]) => connections.hasUser(roomId, id))
        .map(([token, user]) => [token, user]),
    );
  }
}

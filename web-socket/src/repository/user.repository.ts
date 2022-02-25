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

  get(userId: Uuid): User | undefined {
    return this.users.get(userId);
  }

  async find(id: Uuid): Promise<User | null> {
    return this.collection?.findOne({ id }, { projection: { _id: 0 } }) || null;
  }

  set(user: User): void {
    this.users.set(user.id, user);
  }

  delete(userId: Uuid): void {
    this.users.delete(userId);
  }

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  list(roomId: Uuid): Map<Uuid, User> {
    return new Map(
      Array.from<[Uuid, User]>(this.users.entries())

        .filter(([id]) => connections.isConnected(roomId, id))
        .map(([token, user]) => [token, user])
    );
  }

  /**
   * Создать пользователя
   * @param user
   */
  create(user: User) {
    const u = { ...user };
    this.users.set(user.id, user);
    return this.collection?.insertOne(u);
  }
}

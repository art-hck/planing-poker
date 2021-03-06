import { Collection } from 'mongodb';
import * as uuid from 'uuid';
import { User, Uuid } from '../../../common/models';
import { Repository } from '../models';
import { roomRepo } from '../mongo';
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

  async find(id: Uuid): Promise<User | undefined> {
    const user = this.users.get(id) || (await this.collection?.findOne({ id }, { projection: { _id: 0 } })) || undefined;
    if (user && !this.users.has(id)) this.users.set(user.id, user);

    return user;
  }

  async update(user: User) {
    this.users.set(user.id, user);

    await this.collection?.updateOne({ id: user.id }, { $set: user });
  }

  set(user: User): void {
    this.users.set(user.id, user);
  }

  async delete(id: Uuid) {
    this.users.delete(id);
    this.collection?.deleteOne({ id });
  }

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  async list(roomId: Uuid): Promise<Map<Uuid, User>> {
    const room = roomRepo.get(roomId);
    const users = await this.collection?.find({ id: { $in: Array.from(room?.users.keys() || []) } }, { projection: { _id: 0 } }).toArray() ||
      Array.from(this.users.values()).filter(u => room?.users.has(u.id));


    return new Map(Array.from<[Uuid, User]>(users.map(user => {
      user.online = connections.isConnected(roomId, user.id);
      return [user.id, user];
    })));
  }

  /**
   * Создать пользователя
   * @param newUser
   */
  async register(newUser: Omit<User, 'id'>) {
    const user: User = { ...newUser, id: uuid.v4() };
    this.users.set(user.id, user);
    await this.collection?.insertOne(user);

    return user;
  }
}

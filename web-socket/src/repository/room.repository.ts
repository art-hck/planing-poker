import { Collection } from 'mongodb';
import { WebSocket } from 'ws';
import { Room, RoomRole, Uuid } from '../../../common/models';
import { DeniedError } from '../models/denied-error.ts';
import { Repository } from '../models/repository';
import { roomRepo, usersRepo } from '../mongo';
import { deserialize, serialize } from '../utils/set-map-utils';
import { connections } from './connections.repository';

export class RoomRepository implements Repository<Room> {
  readonly repositoryName = 'room';
  readonly rooms = new Map<Uuid, Room>();
  private collection?: Collection<Room>;

  init(collection: Collection<Room>) {
    this.collection = collection;
    collection
      .find({})
      .toArray()
      .then(rooms => rooms.map(({ _id: {}, ...room }) => room).forEach(room => this.rooms.set(room.id, deserialize(room))));
  }

  get(id: Uuid) {
    return this.rooms.get(id);
  }

  async create(id: Uuid, name: string, userId: Uuid) {
    const users = new Map<Uuid, Set<RoomRole>>().set(userId, new Set([RoomRole.admin, RoomRole.user]));
    const room: Room = { id, name, votingIds: new Set(), users };
    this.rooms.set(room.id, room);

    await this.collection?.insertOne(serialize(room));
  }

  async update(room: Room) {
    this.rooms.set(room.id, room);

    await this.collection?.updateOne({ id: room.id }, { $set: serialize(room) }, { upsert: true });
  }

  async delete(room: Room) {
    this.rooms.delete(room.id);
    await this.collection?.deleteOne({ id: room.id });
  }

  /**
   * Войти в комнату
   * @param room
   * @param userId
   * @param ws
   */
  async join(room: Room, userId: Uuid, ws: WebSocket) {
    if (!room.users.has(userId)) {
      room.users.set(userId, new Set([RoomRole.user]));
    }

    if (!this.hasAdmins(room)) {
      room.users.get(userId)?.add(RoomRole.admin); // Уху, в комнате нет админов. Хапаем права себе
    }

    connections.add(room.id, userId, ws);
    return this.update(room);
  }

  async setRole(room: Room, userId: Uuid, role: RoomRole) {
    switch (role) {
      case RoomRole.admin:
        room.users.forEach(user => user.delete(RoomRole.admin));
        room.users.get(userId)?.add(RoomRole.admin);
        break;
      case RoomRole.observer:
        room.users.get(userId)?.delete(RoomRole.user);
        room.users.get(userId)?.add(RoomRole.observer);
        break;
      case RoomRole.user:
        room.users.get(userId)?.delete(RoomRole.observer);
        room.users.get(userId)?.add(RoomRole.user);
        break;
    }

    return roomRepo.update(room);
  }

  /**
   * Список комнат доступных для пользователя
   * @param userId
   */
  availableRooms(userId: Uuid): Map<Uuid, { id: Uuid; name: string }> {
    return new Map(
      Array.from(this.rooms.values())
        .filter(room => room.users.has(userId))
        .map(({ id, name }) => [id, { id, name }]),
    );
  }

  /**
   * Найти комнату по голосованию
   * @param votingId
   */
  getByVotingId(votingId: Uuid): Room | undefined {
    return Array.from(this.rooms.values()).find(r => r.votingIds.has(votingId));
  }

  /**
   * Проверить является ли пользователь админом комнаты
   * @param roomId
   * @param userId
   */
  verifyAdmin(roomId: Uuid, userId: Uuid) {
    const user = usersRepo.users.get(userId);
    const room = this.rooms.get(roomId);

    if (user && !user?.su && !room?.users.get(user.id)?.has(RoomRole.admin)) {
      throw new DeniedError();
    }
  }

  /**
   * Есть ли админ и он онлайн?
   * @param room
   */
  hasAdmins(room: Room): boolean {
    return Array.from(room.users.entries()).some(([id, roles]) => roles.has(RoomRole.admin) && connections.hasUser(room.id, id));
  }
}

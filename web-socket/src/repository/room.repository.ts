import { Collection } from 'mongodb';
import * as uuid from 'uuid';
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
      .then(rooms => rooms.map(({ _id: {}, ...room }) => room).forEach(room => {
        if (!room.points?.length) { // Fallback for old rooms without points
          room.points = ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40'];
        }
        if (!room.canPreviewVotes) { // Fallback for old rooms without votesVisibility
          room.canPreviewVotes = [RoomRole.observer, RoomRole.admin];
        }
        this.rooms.set(room.id, deserialize(room));
      }));
  }

  get(id: Uuid) {
    return this.rooms.get(id) ?? Array.from(this.rooms.values()).find(room => room.alias && room.alias.toLowerCase() === id.toLowerCase());
  }

  async create(name: string, userId: Uuid, points: string[], canPreviewVotes: RoomRole[], alias: string | null) {
    const id = uuid.v4();
    const users = new Map<Uuid, Set<RoomRole>>().set(userId, new Set([RoomRole.admin, RoomRole.user]));
    alias = alias && Array.from(this.rooms.values()).every(room => room.alias !== alias) ? alias.toLowerCase() : null;
    const room: Room = { id, name, votingIds: new Set(), users, points, canPreviewVotes, alias };
    this.rooms.set(room.id, room);
    await this.collection?.insertOne(serialize(room));

    return room;
  }

  async update(room: Room) {
    this.rooms.set(room.id, room);

    await this.collection?.updateOne({ id: room.id }, { $set: serialize(room) }, { upsert: true });
  }

  async delete(id: Uuid) {
    this.rooms.delete(id);
    await this.collection?.deleteOne({ id });
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

    connections.connect(room.id, userId, ws);
    return this.update(room);
  }

  /**
   * Покинуть комнату
   * @param room
   * @param userId
   */
  async leave(room: Room, userId: Uuid) {
    room.users.delete(userId);
    connections.disconnectUser(room.id, userId);
    return this.update(room);
  }

  /**
   * Установить роль пользователя в комнате
   * @param room
   * @param userId
   * @param role
   */
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
  availableRooms(userId: Uuid): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.users.has(userId));
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
    const user = usersRepo.get(userId);
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
    return Array.from(room.users.values()).some(roles => roles.has(RoomRole.admin));
  }

  /**
   * Проверка адреса на доступность
   * @param alias
   */
  async checkAlias(alias: string): Promise<boolean> {
    return !Array.from(this.rooms.values()).some(room => room.alias && room.alias.toLowerCase() === alias.toLowerCase());
  }
}

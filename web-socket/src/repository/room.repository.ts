import { Collection } from 'mongodb';
import * as uuid from 'uuid';
import { WebSocket } from 'ws';
import { Room, RoomRole, Uuid } from '../../../common/models';
import { DeniedError } from '../errors/denied-error';
import { InvalidParamsError } from '../errors/invalid-params-error';
import { RoomAccessError } from '../errors/room-access-error';
import { Repository } from '../models';
import { roomPasswordRepo, roomRepo, usersRepo } from '../mongo';
import { deserialize, serialize } from '../utils/set-map-utils';
import { connections } from './connections.repository';

export class RoomRepository implements Repository<Room> {
  readonly repositoryName = 'room';
  readonly rooms = new Map<Uuid, Room>();
  private collection?: Collection<Room>;
  private defaultValues: Partial<Room> = { // Fallback for old rooms
    points: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40'],
    canPreviewVotes: [RoomRole.observer, RoomRole.admin],
    private: false
  };

  init(collection: Collection<Room>) {
    this.collection = collection;
    collection
      .find({})
      .toArray()
      .then(rooms => rooms.map(({ _id: {}, ...room }) => room)
        .forEach(room => this.rooms.set(room.id, deserialize({ ...this.defaultValues, ...room }))));
  }

  get(id: Uuid) {
    return this.rooms.get(id) ?? Array.from(this.rooms.values()).find(room => room.alias && room.alias.toLowerCase() === id.toLowerCase());
  }

  async create(name: string, userId: Uuid, points: string[], canPreviewVotes: RoomRole[], alias: string | null, password?: string) {
    const id = uuid.v4();
    const users = new Map<Uuid, Set<RoomRole>>().set(userId, new Set([RoomRole.admin, RoomRole.user]));
    const user = usersRepo.get(userId);

    if (user && !user?.su && !user.verified) {
      throw new InvalidParamsError(`User is not verified`);
    }

    alias = alias && Array.from(this.rooms.values()).every(room => room.alias !== alias && room.id !== alias) ? alias.toLowerCase() : null;
    const room: Room = { id, name, votingIds: new Set(), users, points, canPreviewVotes, alias, private: !!password };

    if (password) {
      await roomPasswordRepo.create(room.id, password);
    }

    this.rooms.set(room.id, room);
    await this.collection?.insertOne(serialize(room));

    return room;
  }

  async update(room: Room) {
    room.alias = room.alias && Array.from(this.rooms.values()).every(({ id, alias }) => {
      return id === room.id || (alias !== room.alias && id !== room.alias);
    }) ? room.alias.toLowerCase() : null;
    this.rooms.set(room.id, room);

    await this.collection?.updateOne({ id: room.id }, { $set: serialize(room) }, { upsert: true });

    return room;
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
   * @param password
   */
  async join(room: Room, userId: Uuid, ws: WebSocket, password?: string) {

    if (!room.users.has(userId) && room.private &&  (!password || !await roomPasswordRepo.verify(room.id, password))) {
      throw new RoomAccessError();
    }

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
   * Список комнат, где пользователь является админом
   * @param userId
   */
  ownRooms(userId: Uuid): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.users.get(userId)?.has(RoomRole.admin));
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
   * Есть ли админ?
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

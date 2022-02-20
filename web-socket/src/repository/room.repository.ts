import { Collection } from "mongodb";
// import { Room, RoomRole, Uuid } from "../../../common";
import { Room, RoomRole, Uuid } from "../../../common/models";
import { deserialize, serialize } from "../utils/set-map-utils";
import { roomRepo, usersRepo } from "../server";
import { WebSocket } from "ws";

export class RoomRepository {
  readonly rooms = new Map<Uuid, Room>();

  constructor(private collection: Collection<Room>) {
    collection.find({}).toArray().then(rooms => rooms
      .map(({ _id, ...room }) => room)
      .forEach(room => this.rooms.set(room.id, deserialize(room))));
  }

  get(id: Uuid) {
    return this.rooms.get(id);
  }

  async add(id: Uuid, name: string, userId: Uuid) {
    const room: Room = {
      id, name,
      connections: new Map(),
      votingIds: new Set(),
      users: (new Map<Uuid, Set<RoomRole>>()).set(userId, new Set([RoomRole.admin, RoomRole.user])),
    };
    this.rooms.set(room.id, room);

    await this.collection.insertOne(serialize(this.clean(room)))
  }

  async update(room: Room) {
    this.rooms.set(room.id, room);

    await this.collection.updateOne({ id: room.id }, { $set: serialize(this.clean(room)) }, { upsert: true })
  }

  async delete(room: Room) {
    this.rooms.delete(room.id);
    await this.collection.deleteOne({ id: room.id })
  }

  /**
   * Выйти из комнаты
   * @param room
   * @param userId
   */
  async leave(room: Room, userId: Uuid) {
    room.users.delete(userId)
    return this.update(room);
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
      room.users.get(userId)?.add(RoomRole.admin) // Уху, в комнате нет админов. Хапаем права себе
    }

    room.connections?.has(userId) ? room.connections?.get(userId)!.add(ws) : room.connections?.set(userId, new Set([ws]));
    return this.update(room);
  }

  async setRole(room: Room, userId: Uuid, role: RoomRole) {
    switch (role) {
      case RoomRole.admin:
        room.users.forEach(user => user.delete(RoomRole.admin))
        room.users.get(userId)?.add(RoomRole.admin);
        break;
      case RoomRole.observer:
        room.users.get(userId)?.delete(RoomRole.user)
        room.users.get(userId)?.add(RoomRole.observer)
        break;
      case RoomRole.user:
        room.users.get(userId)?.delete(RoomRole.observer)
        room.users.get(userId)?.add(RoomRole.user)
        break;
    }

    return roomRepo.update(room);
  }

  /**
   * Комната без данных о соединениях
   * @TODO вынести соединения в отдельную сущность
   */
  clean(room: Room): Room {
    const { connections, ...data } = room
    return { ...data, connections: new Map() };
  }

  /**
   * Список комнат доступных для пользователя
   * @param userId
   */
  availableRooms(userId: Uuid): Map<Uuid, { id: Uuid, name: string }> {
    return new Map(Array.from(this.rooms.values())
      .filter((room) => room.users.has(userId))
      .map(({ id, name }) => ([id, { id, name }])))
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
      throw new Error('denied');
    }
  }

  /**
   * Есть ли админ и он онлайн?
   * @param room
   */
  hasAdmins(room: Room): boolean {
    return Array.from(room.users.entries()).some(([id, roles]) => roles.has(RoomRole.admin) && room.connections?.get(id))
  }
}

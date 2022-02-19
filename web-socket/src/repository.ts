import { Room, Token, User, Uuid, Voting } from "../../common/models";
import { RoomRole } from "../../common/models";

export class Repository {
  readonly users = new Map<Uuid, User>();
  readonly votings = new Map<Uuid, Voting>();
  readonly rooms = new Map<Uuid, Room>();
  readonly refreshTokens = new Set<Token>();
  activeVotingId: Uuid | null = null;

  /**
   * Список комнат доступных для пользователя
   * @param userId
   */
  getAvailableRooms(userId: Uuid): Map<Uuid, { id: Uuid, name: string }> {
    return new Map(Array.from(this.rooms.values())
      .filter((room) => room.users.has(userId))
      .map(({ id, name }) => ([id, { id, name }])))
  }

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  getUsers(roomId: Uuid): Map<Uuid, User> {
    const room = this.rooms.get(roomId);
    return new Map(Array.from(this.users.entries())
      .filter(([id]) => room && room.connections?.has(id))
      .map(([token, user]) => [token, user ]));
  }

  /**
   * Список голосований в комнате
   * @param roomId
   * @param userId
   */
  getVotings(roomId: Uuid, userId: Uuid): Map<Uuid, Voting> {
    const room = this.rooms.get(roomId);
    return new Map(Array.from(this.votings.entries())
      .filter(([id]) => room && room.votingIds.has(id))
      .map(([k, v]) => [k, { ...v, votes: this.getVotes(v.id, userId) }]));
  }

  /**
   * Скрывает голоса при необходимости
   * @param voting
   * @param userId
   */
  secureVoting(voting: Voting, userId: Uuid): Voting {
    return {...voting, votes: this.getVotes(voting.id, userId) }
  }

  /**
   * Получить голоса голосования
   * @param votingId
   * @param userId
   */
  getVotes(votingId: Uuid, userId: Uuid): Voting['votes'] {
    const voting = this.votings.get(votingId);
    const user = this.users.get(userId);
    const room = this.getRoomByVotingId(votingId);
    return new Map(Array.from(voting?.votes.entries() || [])
      .map(([u, p]) => [u, (user && room && this.canViewVotes(room.id, user.id)) || voting?.status === 'end' ? p : null]))
  }

  /**
   * Найти комнату по голосованию
   * @param votingId
   */
  getRoomByVotingId(votingId: Uuid): Room | undefined {
    return Array.from(this.rooms.values()).find(r => r.votingIds.has(votingId));
  }

  /**
   * Может ли пользователь видеть голоса в процессе голосования
   * @param roomId
   * @param userId
   */
  canViewVotes(roomId: Uuid, userId: Uuid): boolean {
    const room = this.rooms.get(roomId);
    const roles = room?.users.get(userId);
    return !room || !roles || this.users.get(userId)?.su || roles.has(RoomRole.admin) || roles.has(RoomRole.observer);
  }

  /**
   * Комната без данных о соединениях
   * @TODO вынести соединения в отдельную сущность
   */
  cleanRoom(room: Room): Omit<Room, 'connections'> {
    const { connections, ...data } = room
    return data;
  }

  hasAdmins(room: Room): boolean {
    return Array.from(room.users.values()).some((roles) => roles.has(RoomRole.admin))
  }

  verifyRoomAdmin(roomId: Uuid, userId: Uuid) {
    const user = this.users.get(userId);
    const room = this.rooms.get(roomId);

    if (user && !user?.su && !room?.users.get(user.id)?.has(RoomRole.admin)) {
      throw new Error('denied');
    }
  }
}

export const repository = new Repository();


import { Token, User, Uuid, Voting } from "@common/models";
import { Room } from "./models";

export class Repository {
  readonly users = new Map<Uuid, User>();
  readonly votings = new Map<Uuid, Voting>();
  readonly rooms = new Map<Uuid, Room>();
  readonly refreshTokens = new Set<Token>();
  activeVotingId: Uuid | null = null;

  /**
   * Список комнат доступных для пользователя (в которых он админ, или находится)
   * @param userId
   */
  getAvailableRooms(userId: Uuid): Map<Uuid, { id: Uuid, name: string }> {
    return new Map(Array.from(this.rooms.entries())
      .filter(([, room]) => room.connections.has(userId) || room.adminIds.has(userId))
      .map(([key, { id, name }]) => ([key, { id, name }])))
  }

  /**
   * Список пользователей в комнате
   * @param roomId
   */
  getUsers(roomId: Uuid): Map<Uuid, User> {
    const room = this.rooms.get(roomId);
    return new Map(Array.from(this.users.entries())
      .filter(([id]) => room && room.connections.has(id))
      .map(([token, user]) => [token, { ...user, role: room!.adminIds.has(user.id) ? 'admin' : user.role }]));
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
      .map(([u, p]) => [u, !user || user.role === 'admin' || room?.adminIds.has(user.id) || voting?.status === 'end' ? p : null]))
  }

  /**
   * Найти комнату по голосованию
   * @param votingId
   */
  getRoomByVotingId(votingId: Uuid): Room | undefined {
    return Array.from(this.rooms.values()).find(r => r.votingIds.has(votingId));
  }

  /**
   * Является ли пользователь админом в комнате
   * @param roomId
   * @param userId
   */
  isAdmin(roomId: Uuid, userId: Uuid): boolean {
    return this.users.get(userId)?.role === 'admin' || this.rooms.get(roomId)?.adminIds.has(userId) || false;
  }
}

export const repository = new Repository();

repository.rooms.set('spdr', { id: 'spdr', name: "SPDR Team", connections: new Map(), adminIds: new Set(), votingIds: new Set() });
repository.rooms.set('sis', { id: 'sis', name: "SIS Team", connections: new Map(), adminIds: new Set(), votingIds: new Set() });

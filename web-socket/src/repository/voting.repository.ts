import { Collection } from 'mongodb';
import { Room, RoomRole, Uuid, Voting } from '../../../common/models';
import { Repository } from '../models/repository';
import { roomRepo, usersRepo, votingRepo } from '../mongo';
import { deserialize, serialize } from '../utils/set-map-utils';

export class VotingRepository implements Repository<Voting> {
  readonly repositoryName = 'voting';
  readonly votings = new Map<Uuid, Voting>();
  private collection?: Collection<Voting>;

  init(collection: Collection<Voting>) {
    this.collection = collection;
    collection
      .find({})
      .toArray()
      .then(votings => votings.map(({ _id: {}, ...votings }) => votings).forEach(voting => this.votings.set(voting.id, deserialize(voting))));
  }

  get(id: Uuid) {
    return this.votings.get(id);
  }

  async create(voting: Voting, room: Room) {
    this.votings.set(voting.id, voting);
    room.votingIds.add(voting.id);
    await roomRepo.update(room);
    await this.collection?.insertOne(serialize(voting));
  }

  async createMultiple(votings: Voting[], room: Room) {
    await votings.forEach(voting => this.create(voting, room));
  }

  async update(voting: Voting) {
    this.votings.set(voting.id, voting);
    await this.collection?.updateOne({ id: voting.id }, { $set: serialize(voting) }, { upsert: true });
  }

  async delete(id: Uuid) {
    this.votings.delete(id);
    const room = roomRepo.getByVotingId(id);
    if (room) {
      room.votingIds.delete(id);
      await roomRepo.update(room);
    }

    await this.collection?.deleteOne({ id });
  }

  async vote(voting: Voting, userId: Uuid, point: number) {
    voting.votes.set(userId, point);
    return this.update(voting);
  }

  async unvote(voting: Voting, userId: Uuid) {
    voting.votes.delete(userId);
    await this.update(voting);
  }

  /**
   * Список голосований в комнате
   * @param roomId
   * @param userId
   */
  list(roomId: Uuid, userId: Uuid): Map<Uuid, Voting> {
    const room = roomRepo.rooms.get(roomId);
    return new Map(
      Array.from(this.votings.entries())
        .filter(([id]) => room && room.votingIds.has(id))
        .map(([k, v]) => [k, { ...v, votes: this.votes(v.id, userId) }]),
    );
  }

  /**
   * Активировать голосование
   * @param room
   * @param voting
   */
  async activate(room: Room, voting: Voting) {
    room.activeVotingId = voting.id;

    if (voting.status === 'pristine') {
      voting.status = 'in-progress';
      return this.update(voting);
    }
  }

  /**
   * Перезапустить голосование
   * @param voting
   */
  async restart(voting: Voting) {
    voting.votes.clear();
    voting.status = 'in-progress';
    return this.update(voting);
  }

  /**
   * Открыть карточки
   * @param voting
   */
  async flip(voting: Voting) {
    voting.status = 'end';
    return votingRepo.update(voting);
  }

  /**
   * Получить голоса голосования
   * @param votingId
   * @param userId
   */
  votes(votingId: Uuid, userId: Uuid): Voting['votes'] {
    const voting = this.votings.get(votingId);
    const user = usersRepo.users.get(userId);
    const room = roomRepo.getByVotingId(votingId);
    return new Map(Array.from(voting?.votes.entries() || []).map(([u, p]) => [u, (user && room && this.canViewVotes(room.id, user.id)) || voting?.status === 'end' ? p : null]));
  }

  /**
   * Может ли пользователь видеть голоса в процессе голосования
   * @param roomId
   * @param userId
   */
  canViewVotes(roomId: Uuid, userId: Uuid): boolean {
    const room = roomRepo.rooms.get(roomId);
    const roles = room?.users.get(userId);
    return !room || !roles || usersRepo.users.get(userId)?.su || roles.has(RoomRole.admin) || roles.has(RoomRole.observer);
  }
}

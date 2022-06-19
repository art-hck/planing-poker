import { Collection } from 'mongodb';
import { UserLimits, Uuid } from '../../../common/models';
import { Config } from '../config';
import { Repository } from '../models';

export class UserLimitsRepository implements Repository<UserLimits> {
  readonly repositoryName = 'user-limits';
  readonly userLimits = new Map<Uuid, UserLimits>();
  private collection?: Collection<UserLimits>;
  private defaultUserLimits = {
    maxRooms: Number(Config.limits.maxRooms),
    maxVotings: Number(Config.limits.maxVotings)
  };

  init(collection: Collection<UserLimits>) {
    this.collection = collection;
  }

  get(userId: Uuid): UserLimits | undefined {
    return this.userLimits.get(userId);
  }

  async find(userId: Uuid): Promise<UserLimits> {
    const limits = this.userLimits.get(userId) || (await this.collection?.findOne({ userId }, { projection: { _id: 0 } })) || { userId, ...this.defaultUserLimits };
    if (limits && !this.userLimits.has(userId)) this.userLimits.set(limits.userId, limits);

    return limits;
  }

  async update(limits: UserLimits) {
    this.userLimits.set(limits.userId, limits);

    await this.collection?.updateOne({ id: limits.userId }, { $set: limits });
  }

  set(limits: UserLimits): void {
    this.userLimits.set(limits.userId, limits);
  }

  async delete(id: Uuid) {
    this.userLimits.delete(id);
    this.collection?.deleteOne({ id });
  }
}

import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Repository } from '../models/repository';
import { usersRepo } from '../mongo';

export interface TelegramAccount {
  userId?: Uuid;
  chatId: number;
  code?: number;
  exp: Date;
  linked: boolean;
}

export class TelegramRepository implements Repository<TelegramAccount> {
  readonly repositoryName = 'telegram';
  private collection?: Collection<TelegramAccount>;

  init(collection: Collection<TelegramAccount>) {
    this.collection = collection;
  }

  async register(chatId: number, code: number) {
    const account: TelegramAccount = { code, chatId, linked: false, exp: new Date(Date.now() + 10 * 60 * 1000) };

    const acc = await this.collection?.findOne({ chatId, linked: true });

    return !acc && this.collection?.updateOne({ chatId }, { $set: account }, { upsert: true });
  }

  async handshake(chatId: number, code: number) {
    return this.collection?.updateOne({ chatId }, { $set: { code, exp: new Date(Date.now() + 110 * 60 * 1000) } });
  }

  async link(userId: Uuid, code: number) {
    return this.collection?.updateOne(
      { code, exp: { $gte: new Date() } },
      {
        $set: { userId, linked: true },
        $unset: { code: '', exp: '' }
      }
    );
  }

  async getUser(code: number) {
    const account = await this.collection?.findOneAndUpdate({ code, linked: true, exp: { $gte: new Date() } }, { $unset: { code: '', exp: '' } });
    const userId = account?.value?.userId;
    const user = userId && (await usersRepo.find(userId));
    return user ? user : undefined;
  }
}

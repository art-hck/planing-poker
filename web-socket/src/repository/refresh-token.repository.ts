import { Collection } from 'mongodb';
import { Token } from '../../../common/models';
import { Repository } from '../models/repository';

export class RefreshTokenRepository implements Repository<{ refreshToken: Token }> {
  readonly repositoryName = 'refreshToken';
  private readonly refreshTokens = new Set<Token>();
  private collection?: Collection<{ refreshToken: Token }>;

  init(collection: Collection<{ refreshToken: Token }>) {
    this.collection = collection;
    collection
      .find({})
      .toArray()
      .then(refreshTokens => refreshTokens.forEach(({ refreshToken }) => this.refreshTokens.add(refreshToken)));
  }

  has(refreshToken: Token): boolean {
    return this.refreshTokens.has(refreshToken);
  }

  /**
   * Создать токен
   * @param refreshToken
   */
  async create(refreshToken: Token) {
    if (!this.refreshTokens.has(refreshToken)) {
      this.refreshTokens.add(refreshToken);
      await this.collection?.updateOne({ refreshToken }, { $set: { refreshToken } }, { upsert: true });
    }
  }

  /**
   * Удалить токен
   * @param refreshToken
   */
  async delete(refreshToken: Token) {
    this.refreshTokens.delete(refreshToken);
    await this.collection?.deleteOne({ refreshToken });
  }
}

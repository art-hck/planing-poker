import { Collection } from 'mongodb';
import { Token } from '../../../common/models';
import { Repository } from '../models';
import { jwtDecode } from '../utils/token-utils';

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

  /**
   * Удалить все просроченые токены
   */
  async clean() {
    this.collection?.deleteMany({
      refreshToken: {
        $in: Array.from(this.refreshTokens).filter(rt => {
          const { exp } = jwtDecode(rt) || {}; // проверяем и декодируем токен
          return exp || 0 > Date.now() / 1000;
        })
      }
    });
  }
}

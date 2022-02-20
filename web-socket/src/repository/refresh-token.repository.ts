import { Collection } from "mongodb";
import { Token } from "../../../common/models";

export class RefreshTokenRepository {
  readonly refreshTokens = new Set<Token>();

  constructor(private collection: Collection<{ refreshToken: Token }>) {
    collection.find({}).toArray().then(refreshTokens => refreshTokens.forEach(({ refreshToken }) => this.refreshTokens.add(refreshToken)));
  }

  async add(refreshToken: Token) {
    if (!this.refreshTokens.has(refreshToken)) {
      this.refreshTokens.add(refreshToken);
      console.log('add refreshToken!');
      await this.collection.updateOne({ refreshToken }, { $set: { refreshToken } }, { upsert: true })
    }
  }

  async delete(refreshToken: Token) {
    this.refreshTokens.delete(refreshToken);
    await this.collection.deleteOne({ refreshToken })
  }
}

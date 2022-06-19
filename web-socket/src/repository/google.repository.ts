import { OAuth2Client } from 'google-auth-library';
import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Config } from '../config';
import { Repository } from '../models';
import { usersRepo } from '../mongo';

export interface GoogleAccount {
  id: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  userId?: Uuid;
}

export class GoogleRepository implements Repository<GoogleAccount> {
  readonly repositoryName = 'google';
  private collection?: Collection<GoogleAccount>;

  init(collection: Collection<GoogleAccount>) {
    this.collection = collection;
  }

  /**
   * Получить инфу о гугл-аккаунте пользователя
   * @param code
   * @param googleRedirectUri
   */
  async get(code: string, googleRedirectUri: string) {
    const oAuth2Client = new OAuth2Client(Config.google.clientId, Config.google.clientSecret, googleRedirectUri);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const { data } = await oAuth2Client.request<GoogleAccount>({ url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json' });
    return data;
  }

  /**
   * Зарегистрировать и привязать аккаунт гугл к пользовательскому
   * @param account
   * @param userId
   */
  async register(account: GoogleAccount, userId: Uuid) {
    if (await this.collection?.findOne({ id: account.id, userId: { $exists: true } })) return false;
    await this.collection?.updateOne({ id: account.id }, { $set: { ...account, userId } }, { upsert: true });
    return true;
  }

  /**
   * Получить пользователя по id гугл аккаунта
   * @param id
   */
  async getLinkedUser(id: string) {
    const account = await this.collection?.findOne({ id }, { projection: { _id: 0 } });

    return (account?.userId && (await usersRepo.find(account.userId))) || undefined;
  }
}

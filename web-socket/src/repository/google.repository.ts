import { OAuth2Client } from 'google-auth-library';
import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Config } from '../config';
import { Repository } from '../models/repository';
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
  private oAuth2Client = new OAuth2Client(Config.googleClientId, Config.googleClientSecret, Config.googleRedirectUri);

  init(collection: Collection<GoogleAccount>) {
    this.collection = collection;
  }

  /**
   * Получить инфу о гугл-аккаунте пользователя
   * @param code
   */
  async get(code: string) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);
    const { data } = await this.oAuth2Client.request<GoogleAccount>({ url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json' });
    return data;
  }

  /**
   * Зарегистрировать и привязать аккаунт гугл к пользовательскому
   * @param account
   * @param userId
   */
  async register(account: GoogleAccount, userId: Uuid) {
    return this.collection?.updateOne({ id: account.id }, { $set: { ...account, userId } }, { upsert: true });
  }

  /**
   * Получить пользователя по id гугл аккаунта
   * @param id
   */
  async getLinkedUser(id: string) {
    const account = await this.collection?.findOne({ id }, { projection: { _id: 0 } });

    return (account?.userId && await usersRepo.find(account.userId)) || undefined;
  }
}

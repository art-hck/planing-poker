import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Config } from '../config';
import { EmailCodeError } from '../errors/email-code-error';
import { Repository } from '../models';
import { usersRepo } from '../mongo';
import * as nodemailer from 'nodemailer';
import { log } from '../utils/log';
import { serialize } from '../utils/set-map-utils';

type UserEmail = {
  email: string;
  code?: string;
  codeExp?: number;
  userId?: Uuid;
};

export class UserEmailRepository implements Repository<UserEmail> {
  readonly repositoryName = 'user-email';
  readonly userEmails = new Map<Uuid, UserEmail>();
  private collection?: Collection<UserEmail>;

  init(collection: Collection<UserEmail>) {
    this.collection = collection;
  }

  async get(email: string, code: string): Promise<UserEmail> {
    const account = this.userEmails.get(email) || await this.collection?.findOne({ email });

    if (!account?.code || !account.codeExp || account.code !== code || account.codeExp < +new Date())
      throw new EmailCodeError();

    return account;
  }

  /**
   * Связать email пользователя
   * @param account
   * @param userId
   */
  async link(account: UserEmail, userId: Uuid) {
    if (await this.collection?.findOne({ email: account.email, userId: { $exists: true } }) || this.userEmails.get(account.email)?.userId) return false;

    account.userId = userId;
    delete account.code;
    delete account.codeExp;
    this.userEmails.set(account.email, account);

    await this.collection?.updateOne({ email: account.email }, { $set: serialize({ userId }), $unset: { code: "", codeExp: "" } });
    return true;
  }

  /**
   * Отправить код для проверки email
   * @param email
   */
  sendCode(email: string) {
    const code = Math.round(Math.random() * +('1' + '0'.repeat(6))).toString().padStart(6, '0');
    const codeExp = +new Date(+new Date() + 5 * 60 * 1000);
    const { host, from } = Config.mail;

    this.collection?.updateOne({ email }, { $set: serialize({ email, code, codeExp }) }, { upsert: true });

    this.userEmails.set(email, { ...this.userEmails.get(email) ?? {}, email, code, codeExp });

    if (host && from) {
      nodemailer.createTransport({ host, port: 25 }).sendMail({
        from,
        to: email,
        subject: 'Verification code here',
        text: `Your code: ${code}`,
        html: `<h1>Your code: <b>${code}</b></h1>`
      });
    } else {
      log.cyan('Websocket', `Verify code ${code}`);
    }
  }

  /**
   * Получить пользователя по email
   * @param email
   */
  async getLinkedUser(email: string) {
    const account = this.userEmails.get(email) || await this.collection?.findOne({ email }, { projection: { _id: 0 } });

    return (account?.userId && (await usersRepo.find(account.userId))) || undefined;
  }
}

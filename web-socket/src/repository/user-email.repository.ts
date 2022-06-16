import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Config } from '../config';
import { HandshakeCodeError } from '../errors/handshake-code-error';
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

  /**
   * Связать email пользователя
   * @param email
   * @param code
   * @param userId
   */
  async link(email: string, code: string, userId: Uuid) {
    const account = this.userEmails.get(email) || await this.collection?.findOne({ email });

    if (!account?.code || !account.codeExp || account.code !== code || account.codeExp < +new Date())
      throw new HandshakeCodeError();

    account.userId = userId;
    delete account.code;
    delete account.codeExp;
    this.userEmails.set(email, account);

    await this.collection?.updateOne({ email }, { $set: serialize({ userId }), $unset: { code: "", codeExp: "" } }, { upsert: true });
    return true;
  }

  /**
   * Отправить код для проверки email
   * @param email
   */
  verify(email: string) {
    const code = Math.round(Math.random() * +('1' + '0'.repeat(6))).toString().padStart(6, '0');
    const codeExp = +new Date(+new Date() + 5 * 60 * 1000);
    this.collection?.updateOne({ email }, { $set: serialize({ email, code, codeExp }) }, { upsert: true });

    this.userEmails.set(email, { ...this.userEmails.get(email) ?? {}, email, code, codeExp });

    log.success('Nodemailer', 'Code ' + code);

    if (Config.mailFrom) {
      const data = {
        from: Config.mailFrom,
        to: email,
        subject: 'Verification code here',
        text: `Your code: ${code}`,
        html: `<h1>Your code: <b>${code}</b></h1>`
      };
      nodemailer.createTransport({ host: 'planing-poker.ru', port: 25 }).sendMail(data);
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

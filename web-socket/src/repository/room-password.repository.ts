import * as jwt from 'jsonwebtoken';
import { Collection } from 'mongodb';
import { Uuid } from '../../../common/models';
import { Config } from '../config';
import { Repository } from '../models/repository';
import { serialize } from '../utils/set-map-utils';

type RoomPassword = { roomId: Uuid, token: string };

export class RoomPasswordRepository implements Repository<RoomPassword> {
  readonly repositoryName = 'room-password';
  readonly roomPasswords = new Map<Uuid, RoomPassword>();
  private collection?: Collection<RoomPassword>;
  private readonly jwtRoomSecret = Config.jwtRoomSecret;

  init(collection: Collection<RoomPassword>) {
    this.collection = collection;
  }

  /**
   * Создать пароль на комнату
   * @param roomId
   * @param password
   */
  async create(roomId: Uuid, password: string) {
    const { jwtRoomSecret } = Config;
    const roomPassword: RoomPassword = { roomId, token: jwt.sign(password, jwtRoomSecret) };
    this.roomPasswords.set(roomId, roomPassword);
    await this.collection?.updateOne({ roomId }, { $set: serialize(roomPassword) }, { upsert: true });
  }

  /**
   * Удалить пароль комнаты
   * @param roomId
   */
  async delete(roomId: Uuid) {
    this.roomPasswords.delete(roomId);
    this.collection?.deleteOne({ roomId });
  }

  /**
   * Проверка пароля
   * @param roomId
   * @param password
   */
  async verify(roomId: Uuid, password: string): Promise<boolean> {
    const roomPassword = this.roomPasswords.get(roomId) || await this.collection?.findOne({ roomId }, { projection: { _id: 0 } });
    return roomPassword?.token === jwt.sign(password, this.jwtRoomSecret);
  }
}

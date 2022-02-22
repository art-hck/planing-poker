import { WebSocket } from 'ws';
import { Room, User, Uuid } from '../../../common/models';
import { usersRepo } from '../mongo';
import { log } from '../utils/log';

type Connections = Map<Room['id'], RoomConnections>;
type RoomConnections = Map<User['id'], Set<WebSocket>>;

class ConnectionsRepository {
  private readonly connections: Connections = new Map();

  /**
   * Получить соединения комнаты
   * @param roomId
   */
  get(roomId: Uuid) {
    return this.connections.get(roomId);
  }

  /**
   * Задать соединения комнаты
   * @param roomId
   * @param connections
   */
  set(roomId: Uuid, connections: RoomConnections): Connections {
    return this.connections.set(roomId, connections);
  }

  /**
   * Проверка наличия соединений у комнаты
   * @param roomId
   */
  has(roomId: Uuid): boolean {
    return this.connections.has(roomId);
  }

  /**
   * Получить соединения пользователя
   * @param roomId
   * @param userId
   */
  getByUserId(roomId: Uuid, userId: Uuid): Set<WebSocket> | undefined {
    return this.get(roomId)?.get(userId);
  }

  /**
   * Проверить есть ли соединение пользователя с комнатой
   * @param roomId
   * @param userId
   */
  hasUser(roomId: Uuid, userId: Uuid): boolean {
    return !!this.get(roomId)?.has(userId);
  }

  /**
   * Добавить соединение пользователя с комнатой
   * @param roomId
   * @param userId
   * @param ws
   */
  add(roomId: Uuid, userId: Uuid, ws: WebSocket): void {
    const roomConnections = this.has(roomId) ? this.get(roomId) : this.set(roomId, new Map()).get(roomId);
    roomConnections?.has(userId) ? roomConnections.get(userId)?.add(ws) : roomConnections?.set(userId, new Set([ws]));

    log.normal('WebSocket', `${usersRepo.users.get(userId)?.name} подключился (${roomConnections?.get(userId)?.size} соединений) `);
  }

  /**
   * Удалить соединения пользователя
   * @param roomId
   * @param userId
   * @param ws если параметр не указан удаляет все соединения
   */
  deleteUserConnections(roomId: Uuid, userId: Uuid, ws?: WebSocket): void {
    const userConnections = this.getByUserId(roomId, userId);
    ws && userConnections?.delete(ws);
    log.normal('WebSocket', `${usersRepo.users.get(userId)?.name} отключился (${userConnections?.size} соединений)`);

    if ((userConnections && userConnections.size < 1) || !ws) {
      this.get(roomId)?.delete(userId);
    }
  }
}

export const connections = new ConnectionsRepository();

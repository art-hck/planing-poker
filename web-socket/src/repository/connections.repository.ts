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
   * Проверить есть ли соединение пользователя с комнатой
   * @param roomId
   * @param userId
   */
  isConnected(roomId: Uuid, userId: Uuid): boolean {
    return !!this.get(roomId)?.has(userId);
  }

  /**
   * Добавить соединение пользователя с комнатой
   * @param roomId
   * @param userId
   * @param ws
   */
  connect(roomId: Uuid, userId: Uuid, ws: WebSocket): void {
    const roomConnections = this.connections.has(roomId) ? this.get(roomId) : this.set(roomId, new Map()).get(roomId);
    roomConnections?.has(userId) ? roomConnections.get(userId)?.add(ws) : roomConnections?.set(userId, new Set([ws]));

    log.normal('WebSocket', `${usersRepo.get(userId)?.name} подключился (${roomConnections?.get(userId)?.size} соединений) `);
  }

  disconnect(ws: WebSocket) {
    this.connections.forEach(room =>
      room.forEach(user => {
        user.has(ws) && user.delete(ws);
      })
    );
  }

  /**
   * Отключить пользователя от комнаты
   * @param roomId
   * @param userId
   * @param ws если параметр не указан отключает все соединения
   */
  disconnectUser(roomId: Uuid, userId: Uuid, ws?: WebSocket): void {
    const userConnections = this.get(roomId)?.get(userId);
    if (userConnections) {
      ws && userConnections.delete(ws);
      log.normal('WebSocket', `${usersRepo.get(userId)?.name} отключился (${userConnections?.size} соединений)`);

      if (userConnections.size < 1 || !ws) {
        this.get(roomId)?.delete(userId);
      }
    }
  }

  getRoomId(ws: WebSocket): Uuid | undefined {
    return Array.from(this.connections.entries()).find(([, users]) => Array.from(users.values()).some(user => user.has(ws)))?.[0];
  }
}

export const connections = new ConnectionsRepository();

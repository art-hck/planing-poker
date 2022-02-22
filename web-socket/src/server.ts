import { readFileSync } from 'fs';
import { createServer } from 'https';
import { JsonWebTokenError } from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { Handshake, Uuid, WsMessage } from '../../common/models';
import { Config } from './config';
import { Broadcast, NotFoundError, RoutePayload, Routes, Send } from './models';
import { DeniedError } from './models/denied-error.ts';
import { Session } from './models/session';
import { roomRepo, usersRepo } from './mongo';
import { connections } from './repository/connections.repository';
import { routes } from './routes';
import { log } from './utils/log';
import { getUserId, verifyToken } from './utils/token-utils';

const { wsPort, wsCert, wsKey } = Config;
const replacer = (k: unknown, v: unknown) => (v instanceof Map ? Array.from(v.entries()) : v instanceof Set ? Array.from(v) : v);
const server = wsCert && wsKey && createServer({ cert: readFileSync(wsCert), key: readFileSync(wsKey) });

new WebSocketServer(server ? { server } : { port: Number(wsPort) }).on('connection', ws => {
  const session: Session = {};
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid, targetUserId?: Uuid) => {
    connections.get(roomId)?.forEach((connections, userId) => {
      if (targetUserId && targetUserId !== userId) return;
      connections.forEach(connection => {
        const payload = typeof payloadOrFn === 'function' ? payloadOrFn(userId) : payloadOrFn;
        connection.send(JSON.stringify({ event, payload }, replacer));
      });
    });
  };
  const payload = {};
  const routePayloadPart: Omit<RoutePayload, 'userId'> = { send, broadcast, session, ws, payload };

  ws.on('close', () => {
    if (session.token) {
      const userId = getUserId(session.token);
      log.normal('WebSocket', 'Закрыто соединение', usersRepo.users.get(userId)?.name || '(не авторизован)');
      roomRepo.rooms.forEach(room => routes.leaveRoom({ ...routePayloadPart, userId, payload: { roomId: room.id } }));
    }
  });

  ws.on('message', (message: string) => {
    type Payload = Routes[keyof Routes] extends (arg: RoutePayload<infer R>) => any ? R : never;
    const { action, payload }: WsMessage<Payload> = JSON.parse(message);
    const userId = getUserId((payload as Handshake).token ?? session.token); // Первичная авторизация хранит токен в теле, а дальше храним на сервере

    try {
      if (action !== 'handshake') verifyToken({ ...routePayloadPart, payload, userId });
      action && routes[action]({ ...routePayloadPart, payload, userId });
    } catch (e: unknown) {
      if (e instanceof Error) {
        switch (true) {
          case e instanceof DeniedError:
            log.error('WebSocket', `Доступ запрещен`, action, userId);
            break;
          case e instanceof NotFoundError:
            log.error('WebSocket', `Сущность не найдена`, e.message);
            break;
          case e instanceof JsonWebTokenError:
            session.token = session.refreshToken = undefined;
            send('invalidToken', {});
            routes.bye({ ...routePayloadPart, userId });
            log.error('WebSocket', `Недействительный токен`);
            break;
          default:
            log.error('WebSocket', e.stack);
            throw e;
        }
      } else throw e;
    }
  });
});

if (server) {
  server.listen(wsPort);
}

log.success('WebSocket', `Started at ${wsPort} port`);

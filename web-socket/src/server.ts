import { WebSocketServer } from 'ws';
import { Handshake, Uuid, WsMessage } from "../../common/models";
import { routes } from "./routes";
import { log } from "./utils/log";
import { getUserId, verifyToken } from "./utils/token-utils";
import { Broadcast, NotFoundError, RoutePayload, Routes, Send } from "./models";
import { JsonWebTokenError } from "jsonwebtoken";
import { Session } from "./models/session";
import { Config } from "./config";
import { roomRepo, usersRepo } from "./mongo";
import { createServer } from "https";
import { readFileSync } from "fs";

const { wsPort, wsCert, wsKey } = Config;
const replacer = (k: unknown, v: unknown) => v instanceof Map ? Array.from(v.entries()) : v instanceof Set ? Array.from(v) : v;
const wsConfig = wsCert && wsKey ? { server: createServer({ cert: readFileSync(wsCert), key: readFileSync(wsKey) }) } : { port: Number(wsPort) };

new WebSocketServer(wsConfig).on('connection', ws => {
  const session: Session = {};
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid) => {
    roomRepo.rooms.get(roomId)?.connections.forEach((sessions, userId) => {
      sessions.forEach(session => {
        const payload = typeof payloadOrFn === 'function' ? payloadOrFn(userId) : payloadOrFn;
        session.send(JSON.stringify({ event, payload }, replacer));
      });
    });
  };
  const routePayloadPart: Omit<RoutePayload, 'userId'> = { send, broadcast, session, ws, payload: {} };

  ws.on('close', () => {
    if (session.token) {
      const userId = getUserId(session.token);
      log.normal('WebSocket', 'Закрыто соединение', usersRepo.users.get(userId)?.name || '(не авторизован)');
      routes.bye({ ...routePayloadPart, userId });
    }
  });

  ws.on('message', (message: string) => {
    type Payload = Routes[keyof Routes] extends (arg: RoutePayload<infer R>) => any ? R : never;
    const { action, payload }: WsMessage<Payload> = JSON.parse(message);
    const userId = getUserId((payload as Handshake).token ?? session.token); // Первичная авторизация хранит токен в теле, а дальше храним на сервере

    try {
      if (action !== 'handshake') verifyToken({ ...routePayloadPart, payload, userId });
      action && routes[action]({ ...routePayloadPart, payload, userId });
    } catch (e) {
      if (e instanceof Error && ['reject', 'denied'].includes(e.message)) {
        log.error('WebSocket', `Доступ запрещен`, message);
        send(e.message as 'reject' | 'denied', {});
      } else if (e instanceof NotFoundError) {
        log.error('WebSocket', `Сущность не найдена`, e.message);
      } else if (e instanceof JsonWebTokenError) {
        session.token = session.refreshToken = undefined;
        send('invalidToken', {});
        routes.bye({ ...routePayloadPart, userId });
        log.error('WebSocket', `Недействительный токен`);
      } else {
        log.error('WebSocket', e instanceof TypeError ? e.stack : e);
      }
    }
  });
});

if (wsCert && wsKey) {
  wsConfig.server?.listen(wsPort);
}

log.success('WebSocket', `Started at ${wsPort} port`);

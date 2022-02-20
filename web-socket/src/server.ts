import { WebSocketServer } from 'ws'
import { Handshake, Uuid, WsMessage } from "../../common/models";
import { routes } from "./routes";
import { log } from "./utils/log";
import { getUserId, verifyToken } from "./utils/token-utils";
import { Broadcast, NotFoundError, RoutePayload, Routes, Send } from "./models";
import { JsonWebTokenError } from "jsonwebtoken";
import { Client } from "./models/client";
import { Config } from "./config";
import { roomRepo, usersRepo } from "./mongo";
import { createServer } from "https";
import { readFileSync } from "fs";

const { wsPort, wsCert, wsKey } = Config;
const replacer = (k: unknown, v: unknown) => v instanceof Map ? Array.from(v.entries()) : v instanceof Set ? Array.from(v) : v;
const wsConfig = wsCert && wsKey ? { server: createServer({ cert: readFileSync(wsCert), key: readFileSync(wsKey) }) } : { port: Number(wsPort) };

new WebSocketServer(wsConfig).on('connection', ws => {
  const client: Client = {}
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid) => {
    roomRepo.rooms.get(roomId)?.connections?.forEach((clients, userId) => {
      clients.forEach(client => {
        const payload = typeof payloadOrFn === 'function' ? payloadOrFn(userId) : payloadOrFn;
        client.send(JSON.stringify({ event, payload }, replacer));
      })
    })
  };
  const routePayloadPart: Omit<RoutePayload, 'userId'> = { send, broadcast, client, ws, payload: {} };

  ws.on('close', () => {
    if (client.token) {
      const userId = getUserId(client.token);
      log.normal('WebSocket', 'Закрыто соединение', usersRepo.users.get(userId)?.name || '(не авторизован)');
      routes.bye({ ...routePayloadPart, userId })
    }
  });

  ws.on('message', (message: string) => {
    type Payload = Routes[keyof Routes] extends (arg: RoutePayload<infer R>) => any ? R : never;
    const { action, payload }: WsMessage<Payload> = JSON.parse(message);
    const userId = getUserId(((payload as Handshake).token ?? client.token)!); // Первичная авторизация хранит токен в теле, а дальше храним на сервере

    try {
      if (action !== 'handshake') verifyToken({ ...routePayloadPart, payload, userId })
      routes[action!]({ ...routePayloadPart, payload, userId });
    } catch (e) {
      if (e instanceof Error && ['reject', 'denied'].includes(e.message)) {
        log.error('WebSocket', `Доступ запрещен`, message);
        send(e.message as 'reject' | 'denied', {});
      } else if (e instanceof NotFoundError) {
        log.error('WebSocket', `Сущность не найдена`, e.message);
      } else if (e instanceof JsonWebTokenError) {
        client.token = client.refreshToken = undefined;
        send('invalidToken', {});
        routes.bye({ ...routePayloadPart, userId })
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

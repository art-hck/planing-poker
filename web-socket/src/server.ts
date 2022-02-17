import { WebSocketServer } from 'ws'
import { Token, Uuid, WsMessage } from "@common/models";
import { routes } from "./routes";
import { log } from "./utils/log";
import * as dotenv from 'dotenv'
import { getUserId } from "./utils/get-user-id";
import { Broadcast, RoutePayload, Routes, Send } from "./models";
import { repository } from "./repository";
import { NotFoundError } from "./models/not-found-error";
import { JsonWebTokenError } from "jsonwebtoken";

dotenv.config({ path: "../.env" })

const { rooms, users } = repository;
const replacer = (k: unknown, v: unknown) => v instanceof Map ? Array.from(v.entries()) : v instanceof Set ? Array.from(v) : v;
const port = (Number(process.env['WS_PORT']) || 9000);

new WebSocketServer({ port }).on('connection', ws => {
  const client: { token?: Token } = {}
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid) => {
    rooms.get(roomId)?.connections.forEach((clients, userId) => {
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
      log.normal('Закрыто соединение', users.get(userId)?.name || '(не авторизован)');
      routes.bye({ ...routePayloadPart, userId })
    }
  });

  ws.on('message', (message: string) => {
    try {
      type Message = WsMessage<Routes[keyof Routes] extends (arg: RoutePayload<infer R>) => any ? R : never>;

      const { action, payload }: Message = JSON.parse(message);
      const userId = getUserId((payload.token ?? client.token)!); // Первичная авторизация хранит токен в теле, а дальше храним на сервере
      routes[action!]({ ...routePayloadPart, payload, userId });
    } catch (e) {
      if (e instanceof Error && ['reject', 'denied'].includes(e.message)) {
        log.error(`Доступ запрещен`, message);
        send(e.message as 'reject' | 'denied', {});
      } else if (e instanceof NotFoundError) {
        log.error(`Сущность не найдена`, e.message);
      } else if (e instanceof JsonWebTokenError) {
        send('invalidToken', {});
        log.error(`Недействительный токен`);
      } else {
        log.error(e instanceof TypeError ? e.stack : e);
      }
    }
  });
});

log.success(`Server started at ${port} port`);

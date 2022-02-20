import { WebSocketServer } from 'ws'
import { Handshake, Uuid, WsMessage } from "../../common/models";
import { routes } from "./routes";
import { log } from "./utils/log";
import { MongoClient } from 'mongodb'
import { getUserId, verifyToken } from "./utils/token-utils";
import { Broadcast, NotFoundError, RoutePayload, Routes, Send } from "./models";
import { UserRepository } from "./repository/user.repository";
import { JsonWebTokenError } from "jsonwebtoken";
import { Client } from "./models/client";
import { RefreshTokenRepository } from "./repository/refresh-token.repository";
import { RoomRepository } from "./repository/room.repository";
import { VotingRepository } from "./repository/voting.repository";
import { Config } from "./config";


export let refreshTokenRepo: RefreshTokenRepository;
export let roomRepo: RoomRepository;
export let votingRepo: VotingRepository;
export let usersRepo: UserRepository;

const { dbName, dbPassword, dbUsername, wsPort } = Config;
const mongo = new MongoClient(`mongodb://${dbUsername}:${dbPassword}@localhost:27017`);
const replacer = (k: unknown, v: unknown) => v instanceof Map ? Array.from(v.entries()) : v instanceof Set ? Array.from(v) : v;

mongo.connect().then(() => {
  const db = mongo.db(dbName);
  refreshTokenRepo = new RefreshTokenRepository(db.collection('refreshToken'));
  roomRepo = new RoomRepository(db.collection('room'));
  votingRepo = new VotingRepository(db.collection('voting'));
  usersRepo = new UserRepository();

  new WebSocketServer({ port: Number(wsPort) }).on('connection', ws => {
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
        log.normal('Закрыто соединение', usersRepo.users.get(userId)?.name || '(не авторизован)');
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
          log.error(`Доступ запрещен`, message);
          send(e.message as 'reject' | 'denied', {});
        } else if (e instanceof NotFoundError) {
          log.error(`Сущность не найдена`, e.message);
        } else if (e instanceof JsonWebTokenError) {
          client.token = client.refreshToken = undefined;
          send('invalidToken', {});
          routes.bye({ ...routePayloadPart, userId })
          log.error(`Недействительный токен`);
        } else {
          log.error(e instanceof TypeError ? e.stack : e);
        }
      }
    });
  });

  log.success(`Server started at ${wsPort} port`);

}).catch(e => log.error('DB Error', e));



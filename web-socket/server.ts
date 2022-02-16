import { WebSocketServer } from 'ws'
import { Token, User, Uuid, Voting, WsEvent } from "@common/models";
import { routes } from "./routes";
import * as jwt from "jsonwebtoken";
import { Room } from "./models";
import { log } from "./log";

type MappablePayload<V> = V extends [any, any][] ? Map<V[number][0], V[number][1]> | V : never | V;
export type Send = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>(event: E, payload: MappablePayload<P>) => void;
export type Broadcast = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>(event: E, payloadOrFn: MappablePayload<P> | ((userId: Uuid) => MappablePayload<P>), roomId: Uuid) => void;

export const superSecretString = 'SuperSecretString';

const server = new WebSocketServer({ port: 9000 });
const users = new Map<Uuid, User>();
const votings = new Map<Uuid, Voting>();
const rooms = new Map<Uuid, Room>();

rooms.set('spdr', { id: 'spdr', name: "SPDR Team", connections: new Map(), adminIds: new Set(), votingIds: new Set() });
rooms.set('sis', { id: 'sis', name: "SIS Team", connections: new Map(), adminIds: new Set(), votingIds: new Set() });

const activeVoting: { id: Uuid } = { id: null };

server.on('connection', ws => {
  const client: { token?: Token } = {}
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid) => {
    rooms.get(roomId).connections.forEach((clients, userId) => {
      clients.forEach(client => {
        const payload = typeof payloadOrFn === 'function' ? payloadOrFn (userId) : payloadOrFn;
        client.send(JSON.stringify({ event, payload }, replacer));
      })
    })
  };
  const routePayloadPart = { send, broadcast, users, votings, activeVoting, client, rooms, guard, ws };


  ws.on('close', () => {
    const userId = getUserId(client.token);
    log.normal('Закрыто соединение', users.get(userId)?.name || '(не авторизован)');
    client?.token && routes.bye({ ...routePayloadPart, payload: {}, userId })
  });

  ws.on('message', (message: string) => {
    try {
      const { action, payload, token } = JSON.parse(message);
      routes[action]({ ...routePayloadPart, payload, userId: getUserId(token), token });
    } catch (e) {
      if (e instanceof Error && ['reject', 'denied'].includes(e.message)) {
        log.error(`Доступ запрещен`, message);
        send(e.message as 'reject' | 'denied', {});
      } else {
        log.error(e instanceof TypeError ? e.stack : e);
      }
    }
  });
});

function guard(token: string, roomId?: Uuid) {
  if (!token || (jwt.decode(token)['role'] !== 'admin' && !rooms.get(roomId)?.adminIds.has(getUserId(token)))) {
    throw new Error('denied');
  }
}

function getUserId(token: Token): Uuid | undefined {
  return token && jwt.decode(token)?.['id'];
}

function replacer(key, value) {
  return value instanceof Map ? Array.from(value.entries()) : value instanceof Set ? Array.from(value) : value;
}

log.success('Server started at 9000 port');

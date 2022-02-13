import { WebSocketServer } from 'ws'
import { Token, User, Uuid, Voting, WsEvent } from "@common/models";
import { routes } from "./routes";
import * as jwt from "jsonwebtoken";
import { Room } from "./models";

type MappablePayload<V> = V extends [any, any][] ? Map<V[number][0], V[number][1]> | V : never | V;
export type Send = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>(event: E, payload: MappablePayload<P>) => void;
export type Broadcast = <E extends keyof WsEvent, P extends WsEvent<false>[E] | WsEvent[E]>(event: E, payloadOrFn: MappablePayload<P> | ((token: Token) => MappablePayload<P>), roomId: Uuid) => void;

export const superSecretString = 'SuperSecretString';

const server = new WebSocketServer({ port: 9000 });
const users = new Map<Token, User>();
const votings = new Map<Uuid, Voting>();
const rooms = new Map<Uuid, Room>();

rooms.set('spdr', { id: 'spdr', connections: new Map(), adminIds: new Set(), votingIds: new Set() });
rooms.set('sis', { id: 'sis', connections: new Map(), adminIds: new Set(), votingIds: new Set() });

const activeVoting: { id: Uuid } = { id: null };

server.on('connection', ws => {
  const client: { token?: Token } = {}

  ws.on('close', () => {
    console.log('Закрыто соединение', users.get(client?.token)?.name);
    client?.token && routes.bye({ payload: { token: client.token }, send, broadcast, users, votings, activeVoting, client, rooms, guard, ws })
  });

  ws.on('message', (message: string) => {
    try {
      const { action, payload } = JSON.parse(message);
      routes[action]({ payload, send, broadcast, users, votings, activeVoting, client, rooms, guard, ws });
    } catch (error) {
      console.log('Ошибка', error);
    }
  });

  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const broadcast: Broadcast = (event, payloadOrFn, roomId: Uuid) => {
    rooms.get(roomId).connections.forEach((clients, token) => {
      clients.forEach(client => {
        const payload = typeof payloadOrFn === 'function' ? payloadOrFn(token) : payloadOrFn;
        client.send(JSON.stringify({ event, payload }, replacer));
      })
    })
  }

  function guard(token: string) {
    if (!token || (jwt.decode(token) as User).role !== 'admin') {
      send('denied', {});
    }
  }

  function replacer(key, value) {
    return value instanceof Map ? Array.from(value.entries()) : value;
  }
});

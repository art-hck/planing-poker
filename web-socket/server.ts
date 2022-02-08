import { WebSocketServer } from 'ws'
import { Token, User, Uuid, Voting, WsActions, WsMessage } from "@common/models";
import { routes } from "./routes";
import * as jwt from "jsonwebtoken";

export const superSecretString = 'SuperSecretString';
const server = new WebSocketServer({ port: 9000 });
const users = new Map<Token, User>();
const connections = new Map<Token, number>(); // соединений может быть несколько (зашли с двух вкладок, например)
const votings = new Map<Uuid, Voting>();
const activeVoting: { id: Uuid } = { id: null };

server.on('connection', ws => {
  const client: { token?: Token } = {}

  ws.on('close', () => {
    console.log('Закрыто соединение', users.get(client?.token)?.name);
    client?.token && bye(client.token)
  });

  ws.on('message', (message: string) => {
    try {
      const { action, payload }: WsMessage = JSON.parse(message) as WsMessage;
      routes[action]({ payload, send, broadcast, bye, connections, users, votings, activeVoting, client, guard });
    } catch (error) {
      console.log('Ошибка', error);
    }
  });

  function send(action: `${WsActions}`, payload: unknown) {
    ws.send(JSON.stringify({ action, payload }, replacer));
  }

  function broadcast(action: `${WsActions}`, payload: unknown) {
    server.clients.forEach(client => client.send(JSON.stringify({ action, payload }, replacer)));
  }

  function bye(token: Token) {
    connections.set(token, connections.get(token) - 1);
    console.log(`${users.get(token)?.name} отключился (${connections.get(token)} соединений)`);

    if (connections.get(token) < 1) {
      users.delete(token);
      delete client.token;
      broadcast('users', users);
    }
  }

  function guard(token: string) {
    if(!token || (jwt.decode(token) as User).role !== 'admin') {
      send('denied', {});
    }
  }
});

export function replacer(key, value) {
  return value instanceof Map ? Array.from(value.entries()) : value;
}


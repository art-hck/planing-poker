import { WebSocketServer } from 'ws'
import { Token, WsActions, WsMessage } from "../common/models";
import { routes } from "./routes";

const port = 9000;
const ws = new WebSocketServer({ port });
const users = new Map<string, Token>();
const connections = new Map<string, number>(); // соединений может быть несколько (зашли с двух вкладок, например)
const votes = new Map<string, number>();

ws.on('connection', wsClient => {
  const client: { token?: string } = {}

  wsClient.on('close', () => client?.token && bye(client.token));

  wsClient.on('message', (message: string) => {
    try {
      const { action, payload }: WsMessage = JSON.parse(message) as WsMessage;
      routes[action]({ payload, send, broadcast, bye, connections, users, votes, client });
    } catch (error) {
      console.log('Ошибка', error);
    }
  });

  function send(action: `${WsActions}`, payload: unknown) {
    wsClient.send(JSON.stringify({ action, payload }));
  }

  function broadcast(action: `${WsActions}`, payload: unknown) {
    ws.clients.forEach(client => client.send(JSON.stringify({ action, payload })));
  }

  function bye(token: string) {
    connections.set(token, connections.get(token) - 1);
    if (connections.get(token) < 1) {
      console.log(`${users.get(token)?.name} отключился`);
      users.delete(token);
      broadcast('users', Array.from(users.values()));
    }
  }
});

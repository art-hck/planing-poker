import { readFileSync } from 'fs';
import { createServer } from 'https';
import { WebSocketServer } from 'ws';
import { Handshake, WsMessage } from '../../common/models';
import { Config } from './config';
import { RoutePayload, Routes, Send } from './models';
import { Session } from './models/session';
import { connections } from './repository/connections.repository';
import { routes } from './routes';
import { broadcast } from './utils/broadcast';
import { errorHandler } from './utils/error-handler';
import { log } from './utils/log';
import { replacer } from './utils/set-map-utils';
import { getUserId, verifyToken } from './utils/token-utils';

const { wsPort, wsCert, wsKey } = Config;
const server = wsCert && wsKey && createServer({ cert: readFileSync(wsCert), key: readFileSync(wsKey) });

new WebSocketServer(server ? { server } : { port: Number(wsPort) }).on('connection', ws => {
  const session: Session = {};
  const send: Send = (event, payload) => ws.send(JSON.stringify({ event, payload }, replacer));
  const payload = {};
  const routePayloadPart: Omit<RoutePayload, 'userId'> = { send, broadcast, session, ws, payload };

  ws.on('message', (message: string) => {
    type Payload = Routes[keyof Routes] extends (arg: RoutePayload<infer R>) => any ? R : never; // @TODO: payload always never :(
    const { action, payload }: WsMessage<Payload> = JSON.parse(message);
    const userId = getUserId((payload as Handshake).token ?? session.token); // Первичная авторизация хранит токен в теле, а дальше храним на сервере

    try {
      if (action !== 'handshake') verifyToken({ ...routePayloadPart, payload, userId });
      action && routes[action]({ ...routePayloadPart, payload, userId })?.catch(e => errorHandler(e, { ...routePayloadPart, userId }));
    } catch (e) {
      errorHandler(e, { ...routePayloadPart, userId });
    }
  });

  ws.on('close', () => {
    if (session.token) {
      const roomId = connections.getRoomId(ws);
      roomId && routes.leaveRoom({ ...routePayloadPart, userId: getUserId(session.token), payload: { roomId } });
    }
  });
});

if (server) {
  server.listen(wsPort);
}

log.success('WebSocket', `Started at ${wsPort} port`);

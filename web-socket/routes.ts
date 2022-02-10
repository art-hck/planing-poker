import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { Token, User, Uuid, Voting, WsAction } from "@common/models";
import { Broadcast, Send, superSecretString } from "./server";
import { WebSocket } from "ws";

interface RoutePayload<T = unknown> {
  payload: T,
  send: Send,
  broadcast: Broadcast,
  connections: Map<Token, Set<WebSocket>>,
  users: Map<Uuid, User>,
  votings: Map<Uuid, Voting>,
  activeVoting: { id: Uuid },
  client: { token?: Token },
  guard: (token: string) => void,
  ws: WebSocket
}

type Routes = { [P in keyof WsAction]: (payload: RoutePayload<WsAction[P]>) => void; };

export const routes: Routes = {
  handshake: route => {
    let { payload: { name, teamRole, token, password }, send, broadcast, connections, ws, activeVoting, users, client, votings } = route;
    if (password && password !== '123123') {
      send('reject', {});
      return;
    }

    const user: User = (name ? { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' } : jwt.decode(token)) as User;
    client.token = token = token ?? jwt.sign(user, superSecretString);
    connections.has(token) ? connections.get(token).add(ws) : connections.set(token, new Set([ws]));
    users.set(token, user);
    console.log(`${user.name} подключился (${connections.get(token).size} соединений) `);
    send('handshake', { token });

    // запрашивать на стороне клиента!
    broadcast('users', users);
    send('votings', Array.from(votings.entries()).map(([k, v]) => {
      return [k, { ...v, votes: Array.from(v.votes.entries()).map(([u, p]) => [u, user.role === 'admin' || v.status === 'end' ? p : null]) }];
    }) as [Uuid, Voting<true>][]);

    if (votings.get(activeVoting.id)) {
      send('activateVoting', { votingId: activeVoting.id })
    }
    // запрашивать на стороне клиента!
  },

  bye: route => {
    const { payload: { token }, connections, users, client, broadcast, ws } = route;
    connections.get(token)?.delete(ws);

    console.log(`${users.get(token)?.name} отключился (${connections.get(token).size} соединений)`);

    if (connections.get(token)?.size < 1) {
      users.delete(token);
      delete client.token;
      broadcast('users', users);
    }
  },

  vote: route => {
    const { payload: { token, point, votingId }, broadcast, users, votings } = route;
    const userId = users.get(token)?.id;

    votings.get(votingId).votes?.set(userId, point);
    broadcast('voted', token => {
      return users.get(token)?.role === 'admin' ? { userId, votingId, point } : { userId, votingId };
    });
  },

  unvote: route => {
    const { votings, broadcast, users, payload: { token, votingId } } = route;
    const userId = users.get(token)?.id;
    votings.get(votingId).votes?.delete(userId);
    broadcast('unvoted', { userId, votingId });
  },

  restartVoting: route => {
    const { broadcast, votings, guard, payload: { votingId, token } } = route;
    guard(token);
    votings.get(votingId).votes?.clear();
    votings.get(votingId).status = 'in-progress';

    broadcast('restartVoting', votings.get(votingId));
  },

  flip: route => {
    const { broadcast, guard, payload: { votingId, token }, votings } = route;
    guard(token);
    votings.get(votingId).status = 'end';
    broadcast('flip', votings.get(votingId));
  },

  newVoting: route => {
    const { payload: { name, token }, guard, votings, broadcast } = route;
    guard(token);

    votings.clear();
    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' })
    });

    broadcast('votings', votings);
  },

  activateVoting: route => {
    const { payload: { votingId }, votings, activeVoting, broadcast } = route;
    activeVoting.id = votingId;

    if (votings.get(activeVoting.id).status === 'pristine') {
      votings.get(activeVoting.id).status = 'in-progress'
    }

    broadcast('activateVoting', { votingId })
  }
}

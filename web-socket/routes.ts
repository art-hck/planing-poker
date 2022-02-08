import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { Handshake, Token, User, Uuid, Voting, WsActions } from "@common/models";
import { superSecretString } from "./server";
import { WebSocket } from "ws";

interface RoutePayload<T = unknown> {
  payload: T,
  send: (action: `${WsActions}`, payload: unknown) => void,
  broadcast: (action: `${WsActions}`, payload: unknown | ((token: Token) => unknown)) => void,
  bye: (token: Token, ws: WebSocket) => void,
  connections: Map<Token, Set<WebSocket>>,
  users: Map<Uuid, User>,
  votings: Map<Uuid, Voting>,
  activeVoting: { id: Uuid },
  client: { token?: Token },
  guard: (token: string) => void,
  ws: WebSocket
}

export const routes: Partial<Record<`${WsActions}`, (payload: RoutePayload) => void>> = {
  handshake: ({ payload: { name, teamRole, token, password }, send, connections, ws, activeVoting, broadcast, users, client, votings }: RoutePayload<Handshake>) => {
    if (password && password !== '123123') {
      send('reject', {});
      return;
    }

    const user: User = (name ? { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' } : jwt.decode(token)) as User;
    client.token = token = token ?? jwt.sign(user, superSecretString);
    connections.has(token) ? connections.get(token).add(ws) : connections.set(token, new Set([ws]))
    users.set(token, user);
    console.log(`${user.name} подключился (${connections.get(token).size} соединений) `);
    send('handshake', { token });

    // запрашивать на стороне клиента!
    broadcast('users', users);
    send('votings', Array.from(votings.entries()).map(([k, v]) => {
      return [k, user.role === 'admin' || v.status === 'end' ? v : { ...v, votes: undefined }];
    }));
    if (votings.get(activeVoting.id)) {
      send('activateVoting', { votingId: activeVoting.id })
    }
    // запрашивать на стороне клиента!
  },

  bye: ({ payload: { token }, bye, ws }: RoutePayload<{ token?: Token }>) => bye(token, ws),
  users: ({ send, users }: RoutePayload) => send('users', users),

  vote: ({ payload: { token, point, votingId }, broadcast, users, votings }: RoutePayload<{ token: Token, votingId: Uuid, point: number }>) => {
    const userId = users.get(token)?.id;
    users.get(token).voted = true;

    votings.get(votingId).votes?.set(userId, point);

    broadcast('voted', token => {
      return users.get(token)?.role === 'admin' ? { userId, votingId, point } : { userId, votingId };
    });
  },

  unvote: ({ votings, broadcast, users, payload: { token, votingId } }: RoutePayload<{ token: Token, votingId: Uuid }>) => {
    const userId = users.get(token)?.id;
    users.get(token).voted = false;
    votings.get(votingId).votes?.delete(userId);
    broadcast('unvoted', { userId, votingId });
  },

  endVoting: ({ broadcast, votings, activeVoting, users, guard, payload: { votingId, token } }: RoutePayload<{ votingId: Uuid, token: string }>) => {
    guard(token);
    activeVoting.id = undefined;
    votings.get(votingId).votes?.clear();
    votings.get(votingId).status = 'end';
    users.forEach((u) => u.voted = false);
    broadcast('endVoting', { votingId });
  },

  flip: ({ broadcast, guard, payload: { votingId, token }, votings }: RoutePayload<{ votingId: Uuid, token: Uuid }>) => {
    guard(token);
    broadcast('flip', votings.get(votingId));
  },

  newVoting: ({ payload: { name, token }, guard, votings, broadcast }: RoutePayload<{ name: string, token: string }>) => {
    guard(token)
    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' })
    });

    broadcast('votings', votings);
  },

  activateVoting: ({ payload: { votingId }, votings, activeVoting, broadcast }: RoutePayload<{ votingId: Uuid }>) => {
    if(['pristine', 'in-progress'].includes(votings.get(activeVoting.id)?.status)) {
      votings.get(activeVoting.id).votes.clear(); // если активировали другое голосование - сбрасываем голоса.
    }

    activeVoting.id = votingId;
    broadcast('activateVoting', { votingId })
  }
}


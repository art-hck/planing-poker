import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { Handshake, Token, User, Uuid, Voting, WsActions } from "@common/models";
import { superSecretString } from "./server";

interface RoutePayload<T = unknown> {
  payload: T,
  send: (action: `${WsActions}`, payload: unknown) => void,
  broadcast: (action: `${WsActions}`, payload: unknown) => void,
  bye: (token: Token) => void,
  connections: Map<Token, number>,
  users: Map<Uuid, User>,
  votings: Map<Uuid, Voting>,
  activeVoting: { id: Uuid },
  client: { token?: Token },
  guard: (token: string) => void
}

export const routes: Partial<Record<`${WsActions}`, (payload: RoutePayload) => void>> = {
  handshake: ({ payload: { name, teamRole, token, password }, send, activeVoting, broadcast, connections, users, client, votings }: RoutePayload<Handshake>) => {
    if (password && password !== '123123') {
      send('reject', {});
      return;
    }

    const user: User = (name ? { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' } : jwt.decode(token)) as User;
    client.token = token = token ?? jwt.sign(user, superSecretString);

    send('handshake', { token });
    users.set(token, user);

    // запрашивать на стороне клиента!
    broadcast('users', users);
    send('votings', Array.from(votings.entries()).map(([k, v]) => {
      // delete v.votes;
      return [k, { ...v, votes: undefined }];
    }));
    if (votings.get(activeVoting.id)) {
      send('activateVoting', { votingId: activeVoting.id })
    }
    // запрашивать на стороне клиента!

    connections.set(token, connections.get(token) + 1 || 1)

    console.log(`${user.name} подключился (${connections.get(token)} соединений) `);
  },

  bye: ({ payload: { token }, bye }: RoutePayload<{ token?: Token }>) => bye(token),
  users: ({ send, users }: RoutePayload) => send('users', users),

  vote: ({ payload: { token, point, votingId }, broadcast, users, votings }: RoutePayload<{ token: Token, votingId: Uuid, point: number }>) => {
    const userId = users.get(token)?.id;
    users.get(token).voted = true;

    votings.get(votingId).votes?.set(userId, point);
    broadcast('voted', { userId, votingId });
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

  activateVoting: ({ payload: { votingId }, activeVoting, broadcast }: RoutePayload<{ votingId: Uuid }>) => {
    activeVoting.id = votingId;
    broadcast('activateVoting', { votingId })
  }
}


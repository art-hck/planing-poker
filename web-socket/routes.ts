import { Handshake, Token, WsActions } from "../common/models";
import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";

interface RoutePayload<T = unknown> {
  payload: T,
  send?: (action: `${WsActions}`, payload: unknown) => void,
  broadcast?: (action: `${WsActions}`, payload: unknown) => void,
  bye?: (token: string) => void,
  connections?: Map<string, number>,
  users?: Map<string, Token>
  votes?: Map<string, number>
  client: { token?: string }
}

export const routes: Partial<Record<`${WsActions}`, (payload: RoutePayload) => void>> = {
  handshake: ({ payload, send, broadcast, connections, users, client }: RoutePayload<Handshake>) => {
    let { name, token, password } = payload;
    if (password && password !== '123123') {
      send('reject', {});
      return;
    }
    client.token = token;

    const user: Token = (name ? {
      id: uuid.v4(),
      name,
      role: password ? 'admin' : 'user',
    } : jwt.decode(token)) as Token;

    token = token ?? jwt.sign(user, 'SuperSecretString');
    send('handshake', { token });

    users.set(token, user)
    console.log(`${user.name} подключился`);
    broadcast('users', Array.from(users.values()));
    connections.set(token, connections.get(token) + 1 || 1)

  },
  bye: ({ payload, bye }: RoutePayload<{ token?: string }>) => {
    let { token } = payload;
    bye(token);
  },
  users: ({ send, users }: RoutePayload) => {
    send('users', Array.from(users.values()));
  },
  vote: ({ payload, broadcast, users, votes }: RoutePayload<{ token: string, point: number }>) => {
    const { token, point } = payload
    const id = users.get(token)?.id;
    votes.set(id, point);

    broadcast('voted', { id });
  },
  unvote: ({ votes, broadcast, users, payload }: RoutePayload<{ token: string }>) => {
    const { token } = payload
    const id = users.get(token)?.id;
    votes.delete(id);
    broadcast('unvoted', { id });
  },
  endVoting: ({ broadcast, votes }) => {
    votes.clear();
    broadcast('endVoting', {});
  },
  flip: ({ broadcast, votes }) => {
    broadcast('flip', { votes: Array.from(votes.entries()) });
  },
}

import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { User, Uuid, Voting } from "@common/models";
import { superSecretString } from "./server";
import { Room, Routes } from "./models";

function getUsers(rooms: Map<Uuid, Room>, users: Map<Uuid, User>, room: Room) {
  return Array.from(users.entries()).filter(([token]) => room.connections.has(token)).map(entity => {
    entity[1].role = room.adminIds.has(entity[1].id) ? 'admin' : entity[1].role;
    return entity;
  });
}

export const routes: Routes = {
  handshake: route => {
    let { payload: { name, teamRole, token, password }, send, users, client } = route;
    if (password && password !== '123123') {
      send('reject', {});
      return;
    }

    const user: User = (name ? { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' } : jwt.decode(token)) as User;

    client.token = token = token ?? jwt.sign(user, superSecretString);
    users.set(token, user);

    send('handshake', { token });
  },

  bye: route => {
    const { payload: { token }, rooms, users, broadcast, ws } = route;

    rooms.forEach((room) => {
      if (!room.connections.has(token)) return;
      room.connections.get(token).delete(ws);

      console.log(`${users.get(token)?.name} отключился (${room.connections.get(token).size} соединений)`);

      if (room.connections.get(token)?.size < 1) {
        room.connections.delete(token);
        broadcast('users', getUsers(rooms, users, room), room.id);
      }
    });
  },

  vote: route => {
    const { payload: { token, point, votingId }, broadcast, users, votings, rooms } = route;
    const userId = users.get(token)?.id;

    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;

    votings.get(votingId).votes?.set(userId, point);

    broadcast('voted', token => {
      return users.get(token)?.role === 'admin' ? { userId, votingId, point } : { userId, votingId };
    }, roomId);
  },

  unvote: route => {
    const { votings, broadcast, users, rooms, payload: { token, votingId } } = route;
    const userId = users.get(token)?.id;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;

    votings.get(votingId).votes?.delete(userId);

    broadcast('unvoted', { userId, votingId }, roomId);
  },

  restartVoting: route => {
    const { broadcast, votings, guard, rooms, payload: { votingId, token } } = route;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    guard(token);
    votings.get(votingId).votes?.clear();
    votings.get(votingId).status = 'in-progress';

    broadcast('restartVoting', votings.get(votingId), roomId);
  },

  flip: route => {
    const { broadcast, guard, payload: { votingId, token }, votings, rooms } = route;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    guard(token);
    votings.get(votingId).status = 'end';

    broadcast('flip', votings.get(votingId), roomId);
  },

  newVoting: route => {
    const { payload: { roomId, name, token }, guard, votings, rooms, broadcast } = route;
    guard(token);

    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' });
      rooms.get(roomId).votingIds.add(id);
    });

    broadcast('votings', Array.from(votings.entries()).filter(([id]) => rooms.get(roomId).votingIds.has(id)), roomId);
  },

  activateVoting: route => {
    const { payload: { votingId }, votings, rooms, activeVoting, broadcast } = route;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    activeVoting.id = votingId;

    if (votings.get(activeVoting.id).status === 'pristine') {
      votings.get(activeVoting.id).status = 'in-progress'
    }

    broadcast('activateVoting', { votingId }, roomId);
  },

  newRoom: route => {
    const { rooms, send, users, payload: { token } } = route;
    const id = uuid.v4();

    rooms.set(id, { id, connections: new Map(), adminIds: new Set([users.get(token).id]), votingIds: new Set() });

    send('newRoom', { roomId: id })
  },

  joinRoom: route => {
    let { payload: { roomId, token }, send, broadcast, rooms, ws, activeVoting, users, votings } = route;
    if (!rooms.get(roomId)) {
      roomId && send('notFoundRoom', {});
      return;
    }

    rooms.get(roomId).connections.has(token) ? rooms.get(roomId).connections.get(token).add(ws) : rooms.get(roomId).connections.set(token, new Set([ws]));
    const user: User = users.get(token);

    console.log(`${user.name} подключился (${rooms.get(roomId).connections.get(token).size} соединений) `);

    send('votings', Array.from(votings.entries()).filter(([id]) => rooms.get(roomId).votingIds.has(id)).map(([k, v]) => {
      return [k, { ...v, votes: Array.from(v.votes.entries()).map(([u, p]) => [u, user.role === 'admin' || v.status === 'end' ? p : null]) }];
    }) as [Uuid, Voting<true>][]);

    if (votings.get(activeVoting.id)) {
      send('activateVoting', { votingId: activeVoting.id })
    }

    broadcast('users', getUsers(rooms, users, rooms.get(roomId)), roomId);
  }
}

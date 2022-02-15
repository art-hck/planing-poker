import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { User, Uuid, Voting } from "@common/models";
import { superSecretString } from "./server";
import { Room, Routes } from "./models";
import { log } from "./log";

export const routes: Routes = {
  handshake: r => {
    const { payload: { name, teamRole, password }, token, send, users, client } = r;
    const user: User = (token ? jwt.decode(token) : { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' }) as User;

    if (password && password !== '123123')
      throw new Error('reject');

    client.token = token ?? jwt.sign(user, superSecretString);
    users.set(user.id, user);

    send('handshake', { token: client.token });
  },

  bye: r => {
    const { payload: { roomId }, rooms, users, broadcast, ws, userId } = r;

    rooms.forEach((room) => {
      if ((roomId && room.id !== roomId) || !room.connections.has(userId)) return;
      room.connections.get(userId).delete(ws);

      log.normal(`${users.get(userId)?.name} отключился (${room.connections.get(userId).size} соединений)`);

      if (room.connections.get(userId)?.size < 1) {
        room.connections.delete(userId);
        broadcast('users', getUsers(rooms, users, room.id), room.id);
      }
    });
  },

  vote: r => {
    const { payload: { point, votingId }, broadcast, users, votings, rooms, userId } = r;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;

    votings.get(votingId).votes?.set(userId, point);

    broadcast('voted', id => users.get(id)?.role === 'admin' || rooms.get(roomId).adminIds.has(id) ? { userId, votingId, point } : { userId, votingId }, roomId);
  },

  unvote: r => {
    const { payload: { votingId }, votings, broadcast, rooms, userId } = r;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;

    votings.get(votingId).votes?.delete(userId);

    broadcast('unvoted', { userId, votingId }, roomId);
  },

  restartVoting: r => {
    const { payload: { votingId }, token, broadcast, votings, guard, rooms } = r;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    guard(token, roomId);
    votings.get(votingId).votes?.clear();
    votings.get(votingId).status = 'in-progress';

    broadcast('restartVoting', votings.get(votingId), roomId);
  },

  flip: r => {
    const { payload: { votingId }, token, broadcast, guard, votings, rooms } = r;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    guard(token, roomId);
    votings.get(votingId).status = 'end';

    broadcast('flip', votings.get(votingId), roomId);
  },

  newVoting: r => {
    const { payload: { roomId, name }, token, guard, votings, rooms, broadcast } = r;
    const room = rooms.get(roomId);
    guard(token, roomId);

    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' });
      room.votingIds.add(id);
    });

    broadcast('votings', getVotings(room, votings), roomId);
  },

  deleteVoting: r => {
    const { payload: { votingId, roomId }, token, guard, broadcast, users, rooms, votings, userId } = r;
    guard(token, roomId);


    votings.delete(votingId);

    broadcast('votings', getVotings(rooms.get(roomId), votings, users.get(userId)), roomId);
  },

  activateVoting: r => {
    const { payload: { votingId }, votings, rooms, activeVoting, token, guard, broadcast } = r;
    const roomId = Array.from(rooms.values()).find(r => r.votingIds.has(votingId))?.id;
    guard(token, roomId);

    activeVoting.id = votingId;

    if (votings.get(activeVoting.id).status === 'pristine') {
      votings.get(activeVoting.id).status = 'in-progress'
    }

    broadcast('activateVoting', { votingId }, roomId);
  },

  newRoom: r => {
    const { rooms, send, userId } = r;
    const id = uuid.v4();

    rooms.set(id, { id, connections: new Map(), adminIds: new Set([userId]), votingIds: new Set() });

    send('newRoom', { roomId: id })
  },

  joinRoom: r => {
    const { payload: { roomId }, send, broadcast, rooms, ws, activeVoting, users, votings, userId } = r;
    const room = rooms.get(roomId);
    if (!room) {
      roomId && send('notFoundRoom', {});
      return;
    }

    room.connections.has(userId) ? room.connections.get(userId).add(ws) : room.connections.set(userId, new Set([ws]));
    const user: User = users.get(userId);

    log.normal(`${user.name} подключился (${room.connections.get(userId).size} соединений) `);

    send('votings', getVotings(room, votings, user));

    if (votings.get(activeVoting.id)) {
      send('activateVoting', { votingId: activeVoting.id })
    }

    broadcast('users', getUsers(rooms, users, roomId), roomId);
  },

  rooms: r => {
    const { rooms, send, userId } = r;
    const userRooms = new Map(Array.from(rooms.entries())
      .filter(([, room]) => room.connections.has(userId) || room.adminIds.has(userId))
      .map(([key, { id }]) => ([key, { id }])));

    send('rooms', userRooms);
  }
}

function getUsers(rooms: Map<Uuid, Room>, users: Map<Uuid, User>, roomId: Uuid) {
  const room = rooms.get(roomId);
  return Array.from(users.entries()).filter(([id]) => room.connections.has(id)).map(([token, user]) => {
    return [token, { ...user, role: room.adminIds.has(user.id) ? 'admin' : user.role }];
  }) as [Uuid, User][];
}

function getVotings(room: Room, votings: Map<Uuid, Voting>, user?: User) {
  return Array.from(votings.entries()).filter(([id]) => room.votingIds.has(id)).map(([k, v]) => {
    return [k, { ...v, votes: Array.from(v.votes.entries()).map(([u, p]) => [u, user?.role === 'admin' || room.adminIds.has(user.id) || v.status === 'end' ? p : null]) }];
  }) as [Uuid, Voting<true>][];
}

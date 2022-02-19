import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { RoomRole, Uuid } from "../../common/models";

import { Telegraf } from "telegraf";
import { NotFoundError, Routes } from "./models";
import { repository as repo } from "./repository";
import { log } from "./utils/log";
import { verifyToken } from "./utils/token-utils";

export const routes: Routes = {
  handshake: r => {
    const secret = process.env['JWT_SECRET'] || 'JWT_SECRET';
    const refreshSecret = process.env['JWT_RT_SECRET'] || 'JWT_RT_SECRET';
    const exp = process.env['JWT_EXP'];
    const refreshExp = process.env['JWT_RT_EXP'];

    const { payload: { name, role, password, token, refreshToken }, client } = r;

    if (password && password !== '123123')
      throw new Error('reject');

    const newUser = name && { id: uuid.v4(), name, role, su: !!password };

    client.token = token ?? (newUser ? jwt.sign(newUser, secret, { expiresIn: exp }) : client.token);
    client.refreshToken = refreshToken ?? (newUser ? jwt.sign(newUser, refreshSecret, { expiresIn: refreshExp }) : client.refreshToken);

    verifyToken(r, true);
  },

  bye: r => {
    const { payload: { roomId }, broadcast, userId, ws } = r;

    repo.rooms.forEach(room => {
      const connections = room.connections?.get(userId);
      if ((roomId && room.id !== roomId) || !connections) return;
      connections.delete(ws);
      log.normal(`${repo.users.get(userId)?.name} отключился (${connections.size} соединений)`);

      if (connections.size < 1) {
        room.connections?.delete(userId);
        broadcast('users', repo.getUsers(room.id), room.id);
        if (!roomId) {
          // Если вышел не из комнаты, а полностью - удаляем из комнат, т.к. токен (а следовательно и юзер) удален
          room.users.delete(userId)
          broadcast('room', repo.cleanRoom(room), room.id);
        }
      }
    });
  },

  vote: r => {
    const { payload: { point, votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or votingId: ${votingId}`);

    voting.votes.set(userId, point);

    broadcast('voted', id => repo.canViewVotes(roomId, id) ? { userId, votingId, point } : { userId, votingId }, roomId);
  },

  unvote: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    if (!roomId) throw new NotFoundError(`roomId: ${roomId}`);

    repo.votings.get(votingId)?.votes.delete(userId);

    broadcast('unvoted', { userId, votingId }, roomId);
  },

  restartVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    repo.verifyRoomAdmin(roomId, userId);
    voting?.votes.clear();
    voting.status = 'in-progress';
    broadcast('restartVoting', voting, roomId);
  },

  flip: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);

    repo.verifyRoomAdmin(roomId, userId);
    voting.status = 'end';

    broadcast('flip', voting, roomId);
  },

  newVoting: r => {
    const { payload: { roomId, name }, broadcast, userId } = r;
    const room = repo.rooms.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    repo.verifyRoomAdmin(roomId, userId);

    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      repo.votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' });
      room.votingIds.add(id);
    });

    broadcast('votings', id => repo.getVotings(roomId, id), roomId);
  },

  deleteVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    if (!roomId) throw new NotFoundError(`room by votingId: ${votingId}`);
    repo.verifyRoomAdmin(roomId, userId);


    repo.votings.delete(votingId);

    broadcast('votings', userId => repo.getVotings(roomId, userId), roomId);
  },

  activateVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!voting || !roomId) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    repo.verifyRoomAdmin(roomId, userId);

    repo.activeVotingId = votingId;

    if (voting.status === 'pristine') {
      voting.status = 'in-progress'
    }

    broadcast('activateVoting', { votingId }, roomId);
  },

  newRoom: r => {
    const { payload: { name }, send, userId } = r;
    const id = uuid.v4();

    repo.rooms.set(id, {
      id, name,
      connections: new Map(),
      votingIds: new Set(),
      users: (new Map<Uuid, Set<RoomRole>>()).set(userId, new Set([RoomRole.admin, RoomRole.user])),
    });

    send('newRoom', { roomId: id })
    send('rooms', repo.getAvailableRooms(userId));
  },

  joinRoom: r => {
    const { payload: { roomId }, send, broadcast, userId, ws } = r;
    const room = repo.rooms.get(roomId);

    if (!room) {
      send('notFoundRoom', {});
      throw new NotFoundError(`roomId: ${roomId}`);
    }

    if (!room.users.has(userId)) {
      room.users.set(userId, new Set([RoomRole.user]));
    }

    if (!repo.hasAdmins(room)) {
      room.users.get(userId)?.add(RoomRole.admin) // Уху, в комнате нет админов. Хапаем права себе
    }

    room.connections?.has(userId) ? room.connections?.get(userId)!.add(ws) : room.connections?.set(userId, new Set([ws]));

    log.normal(`${repo.users.get(userId)?.name} подключился (${room.connections?.get(userId)?.size} соединений) `);
    send('votings', repo.getVotings(roomId, userId));

    if (repo.activeVotingId && repo.votings.has(repo.activeVotingId)) {
      send('activateVoting', { votingId: repo.activeVotingId })
    }

    broadcast('room', repo.cleanRoom(room), roomId);
    broadcast('users', repo.getUsers(roomId), roomId);
  },

  setRole: r => {
    const { payload: { roomId, userId, role }, userId: ownUserId, broadcast } = r;
    const room = repo.rooms.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    repo.verifyRoomAdmin(roomId, ownUserId);

    switch (role) {
      case RoomRole.admin:
        room.users.get(ownUserId)?.delete(RoomRole.admin);
        room.users.get(userId)?.add(RoomRole.admin);
        break;
      case RoomRole.observer:
        room.users.get(userId)?.delete(RoomRole.user)
        room.users.get(userId)?.add(RoomRole.observer)
        break;
      case RoomRole.user:
        room.users.get(userId)?.delete(RoomRole.observer)
        room.users.get(userId)?.add(RoomRole.user)
        break;
    }

    broadcast('room', repo.cleanRoom(room), roomId);
  },

  rooms: ({ send, userId }) => send('rooms', repo.getAvailableRooms(userId)),

  feedback: r => {
    const botToken = process.env['TELEGRAM_BOT_TOKEN'];
    const chatId = process.env['TELEGRAM_CHAT_ID'];
    const { payload: { message, subject }, userId, send } = r;

    if (!botToken || !chatId) throw new Error('Telegram token or chat id not provided');
    const bot = new Telegraf(botToken);
    bot.telegram.sendMessage(chatId, `<b>${subject}</b>\nОт: <b>${repo.users.get(userId)?.name}</b>\n${message}`, { parse_mode: 'HTML' })
      .then(() => send('feedback', { success: true }))
      .catch(() => send('feedback', { success: false }));
  }
}

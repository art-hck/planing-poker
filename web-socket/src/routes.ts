import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { log } from "./utils/log";
import { Telegraf } from "telegraf";
import { Routes } from "./models";
import { repository as repo } from "./repository";
import { NotFoundError } from "./models/not-found-error";
import { guard } from "./utils/guard";

export const routes: Routes = {
  handshake: r => {
    const secret = process.env['JWT_SECRET'] || 'JWT_SECRET';
    const refreshSecret = process.env['JWT_RT_SECRET'] || 'JWT_RT_SECRET';
    const exp = process.env['JWT_EXP'];
    const refreshExp = process.env['JWT_RT_EXP'];

    const { payload: { name, teamRole, password, token, refreshToken }, client } = r;

    if (password && password !== '123123')
      throw new Error('reject');

    const newUser = name && { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' };

    client.token = token ?? (newUser ? jwt.sign(newUser, secret, { expiresIn: exp }) : client.token);
    client.refreshToken = refreshToken ?? (newUser ? jwt.sign(newUser, refreshSecret, { expiresIn: refreshExp }) : client.refreshToken);

    guard(r);
  },

  bye: r => {
    const { payload: { roomId }, broadcast, userId, ws } = r;

    repo.rooms.forEach(room => {
      const connections = room.connections.get(userId);
      if ((roomId && room.id !== roomId) || !connections) return;
      connections.delete(ws);
      log.normal(`${repo.users.get(userId)?.name} отключился (${connections.size} соединений)`);

      if (room.id && connections.size < 1) {
        room.connections.delete(userId);
        if (!roomId) room.adminIds.delete(userId); // Если вышел не из комнаты, а полностью - убираем из админов, т.к. токен удален
        broadcast('users', repo.getUsers(room.id), room.id);
      }
    });
  },

  vote: r => {
    const { payload: { point, votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or votingId: ${votingId}`);

    voting.votes.set(userId, point);

    broadcast('voted', id => repo.isAdmin(roomId, id) ? { userId, votingId, point } : { userId, votingId }, roomId);
  },

  unvote: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    if (!roomId) throw new NotFoundError(`roomId: ${roomId}`);

    repo.votings.get(votingId)?.votes.delete(userId);

    broadcast('unvoted', { userId, votingId }, roomId);
  },

  restartVoting: r => {
    const { payload: { votingId }, broadcast} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    guard(r, roomId);
    voting?.votes.clear();
    voting.status = 'in-progress';
    broadcast('restartVoting', voting, roomId);
  },

  flip: r => {
    const { payload: { votingId }, broadcast} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);

    guard(r, roomId);
    voting.status = 'end';

    broadcast('flip', voting, roomId);
  },

  newVoting: r => {
    const { payload: { roomId, name }, broadcast} = r;
    const room = repo.rooms.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    guard(r, roomId);

    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      repo.votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' });
      room.votingIds.add(id);
    });

    broadcast('votings', id => repo.getVotings(roomId, id), roomId);
  },

  deleteVoting: r => {
    const { payload: { votingId }, broadcast} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    if (!roomId) throw new NotFoundError(`room by votingId: ${votingId}`);
    guard(r, roomId);


    repo.votings.delete(votingId);

    broadcast('votings', userId => repo.getVotings(roomId, userId), roomId);
  },

  activateVoting: r => {
    const { payload: { votingId }, broadcast} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!voting || !roomId) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    guard(r, roomId);

    repo.activeVotingId = votingId;

    if (voting.status === 'pristine') {
      voting.status = 'in-progress'
    }

    broadcast('activateVoting', { votingId }, roomId);
  },

  newRoom: r => {
    const { payload: { name }, send, userId } = r;
    const id = uuid.v4();

    repo.rooms.set(id, { id, name, connections: new Map(), adminIds: new Set([userId]), votingIds: new Set() });

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

    if (room.adminIds.size === 0) {
      room.adminIds.add(userId); // Уху, в комнате нет админов. Хапаем права себе
    }

    room.connections.has(userId) ? room.connections.get(userId)!.add(ws) : room.connections.set(userId, new Set([ws]));

    log.normal(`${repo.users.get(userId)?.name} подключился (${room.connections.get(userId)?.size} соединений) `);

    send('votings', repo.getVotings(roomId, userId));
    send('room', { id: room.id!, name: room.name });

    if (repo.activeVotingId && repo.votings.has(repo.activeVotingId)) {
      send('activateVoting', { votingId: repo.activeVotingId })
    }

    broadcast('users', repo.getUsers(roomId), roomId);
  },

  rooms: ({ send, userId }) => send('rooms', repo.getAvailableRooms(userId)),

  feedback: r => {
    const botToken = process.env['TELEGRAM_BOT_TOKEN'];
    const chatId = process.env['TELEGRAM_CHAT_ID'];
    const { payload: { message, subject }, userId, send } = r;

    if (!botToken || !chatId) throw new Error('Telegram token or chat id not provided');
    const bot = new Telegraf(botToken);
    bot.telegram.sendMessage(chatId, `<b>${subject}</b>\nОт: <b>${repo.users.get(userId)?.name}</b>\n${message}`, { parse_mode: "HTML" })
      .then(() => send('feedback', { success: true }))
      .catch(() => send('feedback', { success: false }));
  }
}

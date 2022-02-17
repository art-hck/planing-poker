import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";
import { User } from "@common/models";
import { log } from "./utils/log";
import { Telegraf } from "telegraf";
import { Routes } from "./models";
import { repository as repo } from "./repository";
import { guard } from "./utils/guard";
import { NotFoundError } from "./models/not-found-error";

export const routes: Routes = {
  handshake: r => {
    const secret = process.env['SUPER_SECRET_STRING'] || 'SUPER_SECRET_STRING';
    const { payload: { name, teamRole, password, token }, send, client} = r;

    const user: User = (token ? jwt.verify(token, secret) : { id: uuid.v4(), name, teamRole, role: password ? 'admin' : 'user' }) as User;

    if (password && password !== '123123')
      throw new Error('reject');

    client.token = token ?? jwt.sign(user, secret);
    repo.users.set(user.id, user);

    send('handshake', { token: client.token });
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
    const { payload: { point, votingId }, broadcast, userId} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or votingId: ${votingId}`);

    voting.votes.set(userId, point);

    broadcast('voted', id => repo.isAdmin(roomId, id) ? { userId, votingId, point } : { userId, votingId }, roomId);
  },

  unvote: r => {
    const { payload: { votingId }, broadcast, userId} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    if (!roomId) throw new NotFoundError(`roomId: ${roomId}`);

    repo.votings.get(votingId)?.votes.delete(userId);

    broadcast('unvoted', { userId, votingId }, roomId);
  },

  restartVoting: r => {
    const { payload: { votingId }, broadcast, client} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    guard(client, roomId);
    voting?.votes.clear();
    voting.status = 'in-progress';
    broadcast('restartVoting', voting, roomId);
  },

  flip: r => {
    const { payload: { votingId }, broadcast, client} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);

    guard(client, roomId);
    voting.status = 'end';

    broadcast('flip', voting, roomId);
  },

  newVoting: r => {
    const { payload: { roomId, name }, broadcast, client} = r;
    const room = repo.rooms.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    guard(client, roomId);

    name.split('\n').filter(Boolean).forEach(name => {
      const id = uuid.v4();
      repo.votings.set(id, { id, name: name.trim(), votes: new Map(), status: 'pristine' });
      room.votingIds.add(id);
    });

    broadcast('votings', id => repo.getVotings(roomId, id), roomId);
  },

  deleteVoting: r => {
    const { payload: { votingId, roomId }, broadcast, client} = r;
    guard(client, roomId);


    repo.votings.delete(votingId);

    broadcast('votings', userId => repo.getVotings(roomId, userId), roomId);
  },

  activateVoting: r => {
    const { payload: { votingId }, broadcast, client} = r;
    const roomId = repo.getRoomByVotingId(votingId)?.id;
    const voting = repo.votings.get(votingId);
    if (!voting || !roomId) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    guard(client, roomId);

    repo.activeVotingId = votingId;

    if (voting.status === 'pristine') {
      voting.status = 'in-progress'
    }

    broadcast('activateVoting', { votingId }, roomId);
  },

  newRoom: r => {
    const { payload: { name }, send, userId} = r;
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
    const { payload: { message, subject }, send} = r;
    if (!botToken || !chatId) throw new Error('Telegram token or chat id not provided');
    const bot = new Telegraf(botToken);
    bot.telegram.sendMessage(chatId, `<b>${subject}</b>\n${message}`, { parse_mode: "HTML" })
      .then(() => send('feedback', { success: true }))
      .catch(() => send('feedback', { success: false }));
  }
}

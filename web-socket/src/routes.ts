import * as uuid from "uuid";
import * as jwt from "jsonwebtoken";

import { Telegraf } from "telegraf";
import { NotFoundError, Routes } from "./models";
import { log } from "./utils/log";
import { verifyToken } from "./utils/token-utils";
import { roomRepo, usersRepo, votingRepo } from "./server";
import { Config } from "./config";

export const routes: Routes = {
  handshake: r => {
    const { jwtSecret, jwtRtSecret, jwtExp, jwtRtExp } = Config;
    const { payload: { name, role, password, token, refreshToken }, client } = r;

    if (password && password !== '123123')
      throw new Error('reject');

    const newUser = name && { id: uuid.v4(), name, role, su: !!password };

    client.token = token ?? (newUser ? jwt.sign(newUser, jwtSecret, { expiresIn: jwtExp }) : client.token);
    client.refreshToken = refreshToken ?? (newUser ? jwt.sign(newUser, jwtRtSecret, { expiresIn: jwtRtExp }) : client.refreshToken);

    verifyToken(r, true);
  },

  bye: r => {
    const { payload: { roomId }, broadcast, userId, ws } = r;

    roomRepo.rooms.forEach(room => {
      const connections = room.connections?.get(userId);
      if ((roomId && room.id !== roomId) || !connections) return;
      connections.delete(ws);
      log.normal(`${usersRepo.users.get(userId)?.name} отключился (${connections.size} соединений)`);

      if (connections.size < 1) {
        room.connections?.delete(userId);
        broadcast('users', usersRepo.list(room.id), room.id);
        // if (!roomId) { // @TODO: надо различать когда закрывается вкладка и когда разлогин. Удалять только при разлогине
        // Если вышел не из комнаты, а полностью - удаляем из комнат, т.к. токен (а следовательно и юзер) удален
        // roomRepo.leave(room, userId);
        // broadcast('room', roomRepo.clean(room), room.id);
        // }
      }
    });
  },

  vote: r => {
    const { payload: { point, votingId }, broadcast, userId } = r;
    const roomId = roomRepo.getByVotingId(votingId)?.id;
    const voting = votingRepo.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or votingId: ${votingId}`);

    votingRepo.vote(voting, userId, point)
      .then(() => broadcast('voted', id => votingRepo.canViewVotes(roomId, id) ? { userId, votingId, point } : { userId, votingId }, roomId));

  },

  unvote: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = roomRepo.getByVotingId(votingId)?.id;
    const voting = votingRepo.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or votingId: ${votingId}`);

    votingRepo.unvote(voting, userId)
      .then(() => broadcast('unvoted', { userId, votingId }, roomId));
  },

  restartVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = roomRepo.getByVotingId(votingId)?.id;
    const voting = votingRepo.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);
    roomRepo.verifyAdmin(roomId, userId);

    votingRepo.restart(voting)
      .then(() => broadcast('restartVoting', voting, roomId));
  },

  flip: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const roomId = roomRepo.getByVotingId(votingId)?.id;
    const voting = votingRepo.get(votingId);
    if (!roomId || !voting) throw new NotFoundError(`roomId: ${roomId} or roomId: ${votingId}`);

    roomRepo.verifyAdmin(roomId, userId);

    votingRepo.flip(voting)
      .then(() => broadcast('flip', voting, roomId));
  },

  newVoting: r => {
    const { payload: { roomId, name }, broadcast, userId } = r;
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);
    roomRepo.verifyAdmin(roomId, userId);

    name.split('\n').filter(Boolean)
      .forEach(name => votingRepo.add({ id: uuid.v4(), name: name.trim(), votes: new Map(), status: 'pristine' }, room));

    broadcast('votings', id => votingRepo.list(roomId, id), roomId);
  },

  deleteVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const room = roomRepo.getByVotingId(votingId);
    if (!room) throw new NotFoundError(`room by votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.delete(votingId)
      .then(() => broadcast('votings', userId => votingRepo.list(room.id, userId), room.id));
  },

  activateVoting: r => {
    const { payload: { votingId }, broadcast, userId } = r;
    const room = roomRepo.getByVotingId(votingId);
    const voting = votingRepo.get(votingId);
    if (!voting || !room) throw new NotFoundError(`roomId: ${room?.id} or votingId: ${votingId}`);
    roomRepo.verifyAdmin(room.id, userId);

    votingRepo.activate(room, voting)
      .then(() => broadcast('activateVoting', { votingId }, room.id));
  },

  newRoom: r => {
    const { payload: { name }, send, userId } = r;
    const roomId = uuid.v4();

    roomRepo.add(roomId, name, userId);

    send('newRoom', { roomId })
    send('rooms', roomRepo.availableRooms(userId));
  },

  joinRoom: r => {
    const { payload: { roomId }, send, broadcast, userId, ws } = r;
    const room = roomRepo.get(roomId);

    if (!room) {
      send('notFoundRoom', {});
      throw new NotFoundError(`roomId: ${roomId}`);
    }

    roomRepo.join(room, userId, ws).then(() => {
      log.normal(`${usersRepo.users.get(userId)?.name} подключился (${room.connections?.get(userId)?.size} соединений) `);
      send('votings', votingRepo.list(roomId, userId));
      if (room.activeVotingId && votingRepo.votings.has(room.activeVotingId)) {
        send('activateVoting', { votingId: room.activeVotingId })
      }
      broadcast('room', roomRepo.clean(room), roomId);
      broadcast('users', usersRepo.list(roomId), roomId);
    });
  },

  setRole: r => {
    const { payload: { roomId, userId, role }, userId: ownUserId, broadcast } = r;
    const room = roomRepo.get(roomId);
    if (!room) throw new NotFoundError(`roomId: ${roomId}`);

    roomRepo.verifyAdmin(roomId, ownUserId);

    roomRepo.setRole(room, userId, role)
      .then(() => broadcast('room', roomRepo.clean(room), roomId));
  },

  rooms: ({ send, userId }) => send('rooms', roomRepo.availableRooms(userId)),

  feedback: r => {
    const { tmBotToken, tmChatId } = Config;
    const { payload: { message, subject }, userId, send } = r;

    if (!tmBotToken || !tmChatId) throw new Error('Telegram token or chat id not provided');
    const bot = new Telegraf(tmBotToken);
    bot.telegram.sendMessage(tmChatId, `<b>${subject}</b>\nОт: <b>${usersRepo.users.get(userId)?.name}</b>\n${message}`, { parse_mode: 'HTML' })
      .then(() => send('feedback', { success: true }))
      .catch(() => send('feedback', { success: false }));
  }
}

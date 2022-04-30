import { Handshake } from './handshake';
import { Role } from './role';
import { Room } from './room';
import { RoomRole } from './room-role';
import { Token } from './token';
import { User } from './user';
import { Uuid } from './uuid';
import { Voting } from './voting';

export interface WsAction {
  handshake: Handshake; // Авторизация + регистрация
  bye: {}; // Логаут + удаление временного аккаунта
  linkGoogle: { token: Token, googleCode: string }; // Привязать google аккаунт
  vote: { point: string, votingId: Uuid }; // Проголосовать
  unvote: { votingId: Uuid }; // Отменить голос
  flip: { votingId: Uuid }; // Открыть карты
  restartVoting: { votingId: Uuid }; // Перезапустить голосование
  activateVoting: { votingId: Uuid }; // Активировать голосвание
  newVoting: { names: string[], roomId: Uuid }; // Создать голосвание
  deleteVoting: { votingId: Uuid }; // Удалить голосование
  editVoting: { votingId: Uuid, name: string }; // Изменить голосование
  newRoom: { name: string, canPreviewVotes: RoomRole[], points: string[] }; // Создать комнату
  rooms: {}; // Список комнат
  joinRoom: { roomId: Uuid }; // Присоединиться к комнате
  leaveRoom: { roomId: Uuid, userId?: Uuid }; // Покинуть комнату
  disconnectRoom: { roomId: Uuid }; // Отключиться от комнаты (отличие от leaveRoom в том что из комнаты удаляется только соединение пользователя)
  deleteRoom: { roomId: Uuid }; // Удалить комнату
  setRole: { userId: Uuid, roomId: Uuid, role: RoomRole }; // Задать роль пользователю
  feedback: { message: string, subject: string }; // Обратная связь
  editUser: { name: string; role: Role; }; // Изменить пользователя
}

export interface WsEvent<serialized = true> {
  handshake: Pick<Handshake, 'token' | 'refreshToken'>; // Присылает токены
  restartVoting: Voting<serialized>; // Перезапуск голосвания
  flip: Voting<serialized>; // Открытие карточек
  users: [Uuid, User][]; // Список пользователей
  voted: { userId: Uuid, votingId: Uuid, point?: string }; // Проголосовал
  unvoted: { userId: Uuid, votingId: Uuid }; // Отменил голос
  votings: [Uuid, Voting<serialized>][]; // Список голосований
  activateVoting: { votingId: Uuid }; // Активация голосования
  denied: {}; // Доступ запрещен
  newRoom: { roomId: Uuid }; // Новая комната
  notFound: {}; // Ресурс не найден
  rooms: Room<serialized>[]; // Комнаты
  room: Room<serialized>; // Комната
  deleteRoom: {}; // Удаление комнаты
  leaveRoom: { roomId: Uuid }; // Выход из комнаты
  feedback: { success: boolean }; // Обратная связь
  invalidToken: {}; // Токен не прошёл проверку
  googleAlreadyLinked: {}; // Гугл аккаунт уже привязан
  user: User; // Информация о пользователе
}

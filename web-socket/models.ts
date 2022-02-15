import { Token, User, Uuid, Voting, WsAction } from "@common/models";
import { WebSocket } from "ws";
import { Broadcast, Send } from "./server";

export interface Room {
  id?: Uuid;
  votingIds?: Set<Uuid>;
  adminIds: Set<Uuid>,
  connections: Map<Uuid, Set<WebSocket>>; // соединений может быть несколько (зашли с двух вкладок, например)
}

export interface RoutePayload<T = unknown> {
  payload: T, // Данные
  send: Send, // Функция отправки ответа
  broadcast: Broadcast, // Функция рассылки
  rooms: Map<Uuid, Room>, // Комнаты
  users: Map<Uuid, User>, // Пользователи
  userId: Uuid, // Id юзера совершившего запрос
  votings: Map<Uuid, Voting>, // Голосования
  activeVoting: { id: Uuid }, // Активное голосование
  guard: (token: string, roomId?: Uuid) => void, // Функия проверки прав
  ws: WebSocket // Соединение
  client?: { token?: Token }, // Данные о пользователе (нужны в случае разрыва соединения)
  token?: Token, // Токен пользователя
}

export type Routes = { [P in keyof WsAction]: (payload: RoutePayload<WsAction[P]>) => void; };

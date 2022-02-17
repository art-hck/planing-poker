import { Token, Uuid } from "@common/models";
import { WebSocket } from "ws";
import { Send } from "./send";
import { Broadcast } from "./broadcast";

export interface RoutePayload<T = {}> {
  payload: T, // Данные
  send: Send, // Функция отправки ответа
  broadcast: Broadcast, // Функция рассылки
  userId: Uuid, // Id юзера совершившего запрос
  ws: WebSocket // Соединение
  client: { token?: Token }, // Токен пользователя
}

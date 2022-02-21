import { Uuid } from "../../../common/models";
import { WebSocket } from "ws";
import { Send } from "./send";
import { Broadcast } from "./broadcast";
import { Session } from "./session";

export interface RoutePayload<T = any> {
  payload: T, // Данные
  send: Send, // Функция отправки ответа
  broadcast: Broadcast, // Функция рассылки
  userId: Uuid, // Id юзера совершившего запрос
  ws: WebSocket // Соединение
  session: Session, // Данные клиента (токены)
}

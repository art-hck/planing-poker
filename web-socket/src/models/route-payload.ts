import { WebSocket } from 'ws';
import { Uuid, WsAction } from '../../../common/models';
import { Broadcast } from './broadcast';
import { Send } from './send';
import { Session } from './session';

export interface RoutePayload<T extends keyof WsAction = any> {
  payload: WsAction[T]; // Данные
  send: Send; // Функция отправки ответа
  broadcast: Broadcast; // Функция рассылки
  userId: Uuid; // Id юзера совершившего запрос
  ws: WebSocket; // Соединение
  session: Session; // Данные клиента (токены)
}

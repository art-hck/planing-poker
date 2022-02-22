import { WsAction, WsEvent } from './ws-actions';

export interface WsMessage<T = unknown> {
  action?: keyof WsAction,
  event?: keyof WsEvent,
  payload: T
}

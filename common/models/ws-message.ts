import { WsAction, WsEvent } from "./ws-actions";
import { Token } from "./token";

export interface WsMessage<T = unknown> {
  action?: keyof WsAction,
  event?: keyof WsEvent,
  token?: Token,
  payload: T
}

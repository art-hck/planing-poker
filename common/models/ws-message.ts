import { WsActions } from "./ws-actions";

export interface WsMessage<T = unknown> {
  action: `${WsActions}`,
  payload?: T
}


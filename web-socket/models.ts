import { Token, User, Uuid, Voting, WsAction } from "@common/models";
import { WebSocket } from "ws";
import { Broadcast, Send } from "./server";

export interface Room {
  id?: Uuid;
  votingIds?: Set<Uuid>;
  adminIds: Set<Uuid>,
  connections: Map<Token, Set<WebSocket>>; // соединений может быть несколько (зашли с двух вкладок, например)
}

export interface RoutePayload<T = unknown> {
  payload: T,
  send: Send,
  broadcast: Broadcast,
  rooms: Map<Uuid, Room>,
  users: Map<Uuid, User>,
  votings: Map<Uuid, Voting>,
  activeVoting: { id: Uuid },
  client: { token?: Token },
  guard: (token: string) => void,
  ws: WebSocket
}

export type Routes = { [P in keyof WsAction]: (payload: RoutePayload<WsAction[P]>) => void; };

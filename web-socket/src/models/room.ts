import { Uuid } from "@common/models";
import { WebSocket } from "ws";

export interface Room {
  id: Uuid;
  name: string;
  votingIds: Set<Uuid>;
  adminIds: Set<Uuid>,
  connections: Map<Uuid, Set<WebSocket>>; // соединений может быть несколько (зашли с двух вкладок, например)
}

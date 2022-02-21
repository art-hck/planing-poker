import { Room as SharedRoom, Uuid } from "../../../common/models";
import { WebSocket } from "ws";

export interface Room extends SharedRoom {
  connections: Map<Uuid, Set<WebSocket>>; // соединений может быть несколько (зашли с двух вкладок, например)
}

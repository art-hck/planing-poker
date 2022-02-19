import { Uuid } from "./uuid";
import { RoomRole } from "./room-role";

export interface Room<serialized = false> {
  id: Uuid;
  name: string;
  votingIds: serialized extends false ? Set<Uuid> : Uuid[];
  users: serialized extends false ? Map<Uuid, Set<RoomRole>> : [Uuid, RoomRole[]][];
  connections?: serialized extends false ? Map<Uuid, Set<any>> : never; // соединений может быть несколько (зашли с двух вкладок, например)
}

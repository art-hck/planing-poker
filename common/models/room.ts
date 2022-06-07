import { RoomRole } from './room-role';
import { Uuid } from './uuid';

export interface Room<serialized = false> {
  id: Uuid;
  name: string;
  alias: string | null;
  canPreviewVotes: RoomRole[],
  votingIds: serialized extends false ? Set<Uuid> : Uuid[];
  users: serialized extends false ? Map<Uuid, Set<RoomRole>> : [Uuid, RoomRole[]][];
  activeVotingId?: Uuid;
  points: string[];
  private: boolean;
}

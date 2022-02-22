import { Handshake } from './handshake';
import { Room } from './room';
import { RoomRole } from './room-role';
import { User } from './user';
import { Uuid } from './uuid';
import { Voting } from './voting';

export interface WsAction {
  handshake: Handshake;
  bye: {};
  vote: { point: number, votingId: Uuid };
  unvote: { votingId: Uuid };
  flip: { votingId: Uuid };
  restartVoting: { votingId: Uuid };
  activateVoting: { votingId: Uuid };
  newVoting: { name: string, roomId: Uuid };
  deleteVoting: { votingId: Uuid };
  newRoom: { name: string };
  rooms: {};
  joinRoom: { roomId: Uuid };
  leaveRoom: { roomId: Uuid };
  setRole: { userId: Uuid, roomId: Uuid, role: RoomRole };
  feedback: { message: string, subject: string };
}

export interface WsEvent<serialized = true> {
  handshake: Pick<Handshake, 'token' | 'refreshToken'>;
  restartVoting: Voting<serialized>;
  flip: Voting<serialized>;
  users: [Uuid, User][]
  voted: { userId: Uuid, votingId: Uuid, point?: number }
  unvoted: { userId: Uuid, votingId: Uuid }
  votings: [Uuid, Voting<serialized>][]
  activateVoting: { votingId: Uuid }
  denied: {},
  newRoom: { roomId: Uuid },
  notFound: {},
  rooms: [Uuid, { id: Uuid, name: string }][]
  room: Room<serialized>
  feedback: { success: boolean }
  invalidToken: {}
  bye: {};
}

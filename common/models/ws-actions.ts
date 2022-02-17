import { Voting } from "./voting";
import { Uuid } from "./uuid";
import { User } from "./user";
import { Handshake } from "./handshake";

export interface WsAction {
  handshake: Handshake;
  bye: { roomId?: Uuid };
  vote: { point: number, votingId: Uuid };
  unvote: { votingId: Uuid };
  flip: { votingId: Uuid };
  restartVoting: { votingId: Uuid };
  activateVoting: { votingId: Uuid }
  newVoting: { name: string, roomId: Uuid }
  deleteVoting: { votingId: Uuid, roomId: Uuid }
  newRoom: { name: string }
  rooms: {}
  joinRoom: { roomId: Uuid }
  feedback: { message: string, subject: string }
}

export interface WsEvent<serialized = true> {
  handshake: { token: string };
  restartVoting: Voting<serialized>;
  flip: Voting<serialized>;
  users: [Uuid, User][]
  voted: { userId: Uuid, votingId: Uuid, point?: number }
  unvoted: { userId: Uuid, votingId: Uuid }
  votings: [Uuid, Voting<serialized>][]
  activateVoting: { votingId: Uuid }
  reject: {}
  denied: {},
  newRoom: { roomId: Uuid },
  notFoundRoom: {},
  rooms: [string, { id: Uuid, name: string }][]
  room: { id: Uuid, name: string }
  feedback: { success: boolean }
  invalidToken: {}
}

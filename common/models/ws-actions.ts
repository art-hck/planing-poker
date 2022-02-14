import { Voting } from "./voting";
import { Uuid } from "./uuid";
import { User } from "./user";
import { Handshake } from "./handshake";
import { Token } from "./token";

export interface WsAction {
  handshake: Handshake;
  bye: { token?: Token };
  vote: { point: number, votingId: Uuid, token?: string };
  unvote: { votingId: Uuid, token?: string };
  flip: { votingId: Uuid, token?: string };
  restartVoting: { votingId: Uuid, token?: string };
  activateVoting: { votingId: Uuid, token?: string }
  newVoting: { name: string, roomId: Uuid, token?: string }
  deleteVoting: { votingId: Uuid, roomId: Uuid, token?: string }
  newRoom: { token?: string }
  joinRoom: { roomId: Uuid, token?: string }
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
  notFoundRoom: {}
}

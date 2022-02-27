import { AuthController } from './controllers/auth.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { RoomController } from './controllers/room.controller';
import { UserController } from './controllers/user.controller';
import { VotingController } from './controllers/voting.controller';
import { Routes } from './models';

export const routes: Routes = {
  handshake: AuthController.handshake,
  bye: AuthController.bye,
  linkGoogle: AuthController.linkGoogle,
  editUser: AuthController.edit,
  joinRoom: RoomController.join,
  disconnectRoom: RoomController.disconnect,
  leaveRoom: RoomController.leave,
  newRoom: RoomController.create,
  deleteRoom: RoomController.delete,
  rooms: RoomController.rooms,
  vote: VotingController.vote,
  unvote: VotingController.unvote,
  deleteVoting: VotingController.delete,
  restartVoting: VotingController.restart,
  newVoting: VotingController.create,
  activateVoting: VotingController.activate,
  flip: VotingController.flip,
  setRole: UserController.setRole,
  feedback: FeedbackController.send
};

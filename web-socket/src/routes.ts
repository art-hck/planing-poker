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
  sendCode: AuthController.sendCode,
  joinRoom: RoomController.join,
  disconnectRoom: RoomController.disconnect,
  leaveRoom: RoomController.leave,
  newRoom: RoomController.create,
  updateRoom: RoomController.update,
  deleteRoom: RoomController.delete,
  checkAlias: RoomController.checkAlias,
  rooms: RoomController.rooms,
  vote: VotingController.vote,
  unvote: VotingController.unvote,
  deleteVoting: VotingController.delete,
  editVoting: VotingController.edit,
  restartVoting: VotingController.restart,
  newVoting: VotingController.create,
  activateVoting: VotingController.activate,
  flip: VotingController.flip,
  setRole: UserController.setRole,
  editUser: UserController.edit,
  feedback: FeedbackController.send
};

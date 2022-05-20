import { Uuid } from './uuid';

export interface UserLimits {
  userId: Uuid;
  maxRooms: number;
  maxVotings: number;
}

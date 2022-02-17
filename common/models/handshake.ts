import { Role } from "./role";

export interface Handshake {
  name: string;
  teamRole: Role;
  password: string;
  token: string;
}

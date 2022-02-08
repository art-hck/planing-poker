import { Role } from "./role";

export interface Handshake {
  token?: string;
  name?: string;
  teamRole?: Role;
  password?: string;
}

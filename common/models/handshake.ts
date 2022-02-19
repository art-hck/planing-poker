import { Role } from "./role";
import { Token } from "./token";

export interface Handshake {
  name: string;
  role: Role;
  password: string;
  token: Token;
  refreshToken: Token;
}

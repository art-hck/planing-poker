import { Role } from './role';
import { Token } from './token';

export interface Handshake {
  name?: string;
  password?: string;
  googleCode?: string;
  googleRedirectUri?: string;
  email?: string;
  emailCode?: string;
  role?: Role;
  token?: Token;
  refreshToken?: Token;
}

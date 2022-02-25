import { Role } from './role';
import { Token } from './token';

export interface Handshake {
  name: string;
  password: string;
  telegramCode: number;
  googleCode: string;
  role: Role;
  token: Token;
  refreshToken: Token;
}

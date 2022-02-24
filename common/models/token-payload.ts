import { User } from './user';
import { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
  user?: User;
}

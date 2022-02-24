import { JwtPayload } from 'jsonwebtoken';
import { User } from '../../../common/models';

export interface TokenPayload extends JwtPayload {
  user?: User;
}

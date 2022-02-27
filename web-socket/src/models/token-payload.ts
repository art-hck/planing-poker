import { JwtPayload } from 'jsonwebtoken';
import { Uuid } from '../../../common/models';

export interface TokenPayload extends JwtPayload {
  id?: Uuid;
}

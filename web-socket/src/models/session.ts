import { Token } from '../../../common/models';

export interface Session {
  token?: Token;
  refreshToken?: Token;
}

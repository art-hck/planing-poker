import { Token } from "@common/models";

export interface Client {
  token?: Token;
  refreshToken?: Token
}

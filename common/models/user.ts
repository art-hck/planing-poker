import { Uuid } from "./uuid";
import { Role } from "./role";

export interface User {
  id: Uuid;
  name: string;
  iat: number;
  role: 'user' | 'admin';
  teamRole: Role;
  voted?: boolean;
}

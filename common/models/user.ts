import { Role } from './role';
import { Uuid } from './uuid';

export interface User {
  id: Uuid;
  name: string;
  iat?: number;
  exp?: number;
  su: boolean;
  role: Role;
}

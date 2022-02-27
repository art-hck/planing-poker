import { Role } from './role';
import { Uuid } from './uuid';

export interface User {
  id: Uuid;
  name: string;
  su: boolean;
  role?: Role;
  verified: boolean;
}

import { Role } from "./role";

export const RolesName:Record<`${ Role }`, string> = {
  a: 'Analyst',
  d: 'Designer',
  dev: 'Developer',
  po: 'Product Owner',
  qa: 'Tester',
  sm: 'Scrum Master'
}

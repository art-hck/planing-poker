export enum Role {
  a = 'a',
  dev = 'dev',
  d = 'd',
  po = 'po',
  sm = 'sm',
  qa = 'qa',
}

export const RolesName:Record<`${ Role }`, string> = {
  a: 'Analyst',
  d: 'Designer',
  dev: 'Developer',
  po: 'Product Owner',
  qa: 'Tester',
  sm: 'Scrum Master'
}

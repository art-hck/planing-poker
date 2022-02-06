export interface Token {
  id: string,
  name: string,
  iat: number,
  role: 'user' | 'admin'
}

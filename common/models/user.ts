export interface User {
  name: string,
  vote?: number,
  role: 'user' | 'admin'
}

export interface User {
  id: number
  name: string
  email: string
  avatar: string | null
}

export interface AuthState {
  authenticated: boolean
  user: User | null
}

export interface OAuthState {
  d: string       // database
  p: number       // provider ID
  r: string       // redirect URL
  frontend: boolean  // custom flag
}

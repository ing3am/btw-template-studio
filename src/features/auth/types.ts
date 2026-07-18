export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: 'funcional'
}

export type LoginInput = {
  username: string
  password: string
}

export type AuthSession = {
  user: AuthUser
  token: string
  loggedInAt: string
}

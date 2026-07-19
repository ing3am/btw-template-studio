export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: string
}

export type LoginInput = {
  username: string
  password: string
}

export type AuthSession = {
  user: AuthUser
  token: string
  /** Company NIT from StartSesion (empresa / usuario). */
  nit: string
  loggedInAt: string
}

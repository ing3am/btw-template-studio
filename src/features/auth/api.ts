import type { AuthSession, LoginInput } from './types'

const STORAGE_KEY = 'btw-template-studio.auth.v1'

/** Demo credentials for mock auth (VITE_USE_MOCKS). */
export const DEMO_CREDENTIALS = {
  username: 'funcional',
  password: 'demo123',
} as const

export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.username || !parsed?.token) return null
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function loginRequest(input: LoginInput): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 450))

  const username = input.username.trim().toLowerCase()
  const password = input.password

  if (
    username === DEMO_CREDENTIALS.username &&
    password === DEMO_CREDENTIALS.password
  ) {
    return {
      user: {
        id: 'user-funcional',
        username: DEMO_CREDENTIALS.username,
        displayName: 'Usuario Funcional',
        role: 'funcional',
      },
      token: `mock-${crypto.randomUUID()}`,
      loggedInAt: new Date().toISOString(),
    }
  }

  throw new Error('Usuario o contraseña incorrectos')
}

import type { AuthSession, AuthUser, LoginInput } from './types'

const STORAGE_KEY = 'btw-template-studio.auth.v1'

/**
 * Auth endpoint.
 * Local: proxied via Vite (`/api-auth` → test-apiconnect.febtw.co).
 * Override with VITE_AUTH_URL when needed.
 */
export function getAuthUrl(): string {
  const configured = import.meta.env.VITE_AUTH_URL?.trim()
  if (configured) return configured
  return '/api-auth/auth/Authentication'
}

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

type AuthPayload = {
  token?: string
  message?: string
  error?: string
}

type JwtClaims = {
  nameid?: string
  NameIdentifier?: string
  role?: string
  Role?: string
  company?: string
  scope?: string
}

function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

function userFromToken(username: string, token: string): AuthUser {
  const claims = decodeJwtClaims(token)
  const id = claims?.nameid || claims?.NameIdentifier || username
  const role = claims?.role || claims?.Role || 'user'
  return {
    id: String(id),
    username,
    displayName: String(id),
    role: String(role),
  }
}

export async function loginRequest(input: LoginInput): Promise<AuthSession> {
  const username = input.username.trim()
  const password = input.password

  if (!username || !password) {
    throw new Error('Ingresa usuario y contraseña')
  }

  const response = await fetch(getAuthUrl(), {
    method: 'POST',
    headers: {
      user: username,
      password,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: '',
  })

  const rawText = await response.text()
  let data: AuthPayload | null = null
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as AuthPayload
    } catch {
      data = { message: rawText }
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Usuario o contraseña incorrectos',
    )
  }

  const token = data?.token?.trim()
  if (!token) {
    throw new Error('La autenticación no devolvió un token')
  }

  return {
    user: userFromToken(username, token),
    token,
    loggedInAt: new Date().toISOString(),
  }
}

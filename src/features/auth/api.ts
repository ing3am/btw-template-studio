import type { AuthSession, AuthUser, LoginInput } from './types'

const STORAGE_KEY = 'btw-template-studio.auth.v1'

/** Ambiente header for StartSesion (02 = UAT FE). */
const AUTH_AMBIENTE = (import.meta.env.VITE_AUTH_AMBIENTE || '02').trim() || '02'

/**
 * Auth endpoint — GET StartSesion.
 * Local: proxied via Vite (`/api-auth` → test-app.febtw.co).
 * Override with VITE_AUTH_URL when needed.
 */
export function getAuthUrl(): string {
  const configured = import.meta.env.VITE_AUTH_URL?.trim()
  if (configured) return configured
  return '/api-auth/auth/Autenticacion/StartSesion'
}

export function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.username || !parsed?.token) return null
    return {
      ...parsed,
      nit: parsed.nit?.trim() || '',
      razonSocial: parsed.razonSocial?.trim() || '',
    }
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

/** Digits-only company NIT from the logged-in StartSesion session (`empresa.nit`). */
export function getSessionNit(): string {
  const session = readSession()
  const digits = (session?.nit || '').replace(/\D/g, '')
  if (!digits) {
    throw new Error('No hay NIT de empresa en la sesión. Vuelve a iniciar sesión.')
  }
  return digits
}

type StartSesionUsuario = {
  id?: string
  nit?: string
  nombre?: string
  rol?: string
}

type StartSesionEmpresa = {
  nit?: string
  name?: string
  razonSocial?: string
}

type StartSesionResult = {
  token?: string
  usuario?: StartSesionUsuario
  empresa?: StartSesionEmpresa
}

type StartSesionPayload = {
  success?: boolean
  message?: string
  error?: string
  result?: StartSesionResult | null
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

function buildUser(
  username: string,
  token: string,
  usuario?: StartSesionUsuario,
  empresa?: StartSesionEmpresa,
): AuthUser {
  const claims = decodeJwtClaims(token)
  const id = usuario?.id || claims?.nameid || claims?.NameIdentifier || username
  const role = usuario?.rol || claims?.role || claims?.Role || 'user'
  const displayName =
    usuario?.nombre ||
    empresa?.razonSocial ||
    empresa?.name ||
    String(id)
  return {
    id: String(id),
    username,
    displayName: String(displayName),
    role: String(role),
  }
}

function resolveNit(
  token: string,
  usuario?: StartSesionUsuario,
  empresa?: StartSesionEmpresa,
): string {
  // Prefer empresa.nit from StartSesion (source of truth for company scope).
  const fromEmpresa = empresa?.nit?.replace(/\D/g, '')
  if (fromEmpresa) return fromEmpresa
  const fromUsuario = usuario?.nit?.replace(/\D/g, '')
  if (fromUsuario) return fromUsuario
  const claims = decodeJwtClaims(token)
  return (claims?.company || '').replace(/\D/g, '')
}

function resolveRazonSocial(empresa?: StartSesionEmpresa): string {
  return empresa?.razonSocial?.trim() || empresa?.name?.trim() || ''
}

export async function loginRequest(input: LoginInput): Promise<AuthSession> {
  const username = input.username.trim()
  const password = input.password

  if (!username || !password) {
    throw new Error('Ingresa usuario y contraseña')
  }

  const response = await fetch(getAuthUrl(), {
    method: 'GET',
    headers: {
      user: username,
      password,
      Ambiente: AUTH_AMBIENTE,
      Accept: 'application/json',
    },
  })

  const rawText = await response.text()
  let data: StartSesionPayload | null = null
  if (rawText.trim()) {
    try {
      data = JSON.parse(rawText) as StartSesionPayload
    } catch {
      data = { message: rawText }
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message || data?.error || 'Usuario o contraseña incorrectos',
    )
  }

  const result = data?.result
  const token = result?.token?.trim()
  if (!token) {
    throw new Error('La autenticación no devolvió un token')
  }

  const nit = resolveNit(token, result?.usuario, result?.empresa)
  if (!nit) {
    throw new Error('La autenticación no devolvió el NIT de la empresa')
  }

  return {
    user: buildUser(username, token, result?.usuario, result?.empresa),
    token,
    nit,
    razonSocial: resolveRazonSocial(result?.empresa),
    loggedInAt: new Date().toISOString(),
  }
}

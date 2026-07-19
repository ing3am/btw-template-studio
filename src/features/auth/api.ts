import type { AuthSession, AuthUser, LoginInput } from './types'

const STORAGE_KEY = 'btw-template-studio.auth.v2'
const LEGACY_STORAGE_KEY = 'btw-template-studio.auth.v1'

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
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession & { companyID?: string }
    if (!parsed?.user?.username || !parsed?.token) return null
    return {
      ...parsed,
      nit: parsed.nit?.trim() || '',
      razonSocial: parsed.razonSocial?.trim() || '',
      companyId: (parsed.companyId || parsed.companyID || '').trim(),
    }
  } catch {
    return null
  }
}

export function writeSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
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

export function getSessionCompanyId(): string {
  const session = readSession()
  const id = session?.companyId?.trim() || ''
  if (!id) {
    throw new Error('No hay companyID en la sesión. Vuelve a iniciar sesión.')
  }
  return id
}

type StartSesionUsuario = {
  id?: string
  nit?: string
  nombre?: string
  rol?: string
  companyID?: string
  companyId?: string
}

type StartSesionEmpresa = {
  nit?: string
  name?: string
  razonSocial?: string
  companyID?: string
  companyId?: string
  id?: string
  codigo?: string
}

type StartSesionResult = {
  token?: string
  companyID?: string
  companyId?: string
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
  companyID?: string
  companyId?: string
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
  const fromEmpresa = empresa?.nit?.replace(/\D/g, '')
  if (fromEmpresa) return fromEmpresa
  const fromUsuario = usuario?.nit?.replace(/\D/g, '')
  if (fromUsuario) return fromUsuario
  const claims = decodeJwtClaims(token)
  const claimCompany = (claims?.company || '').trim()
  if (/^\d+$/.test(claimCompany)) return claimCompany
  return ''
}

function resolveRazonSocial(empresa?: StartSesionEmpresa): string {
  return empresa?.razonSocial?.trim() || empresa?.name?.trim() || ''
}

function pickCompanyCode(...candidates: Array<string | undefined | null>): string {
  for (const raw of candidates) {
    const value = raw?.trim()
    if (!value) continue
    if (/^\d+$/.test(value)) continue
    return value
  }
  return ''
}

function resolveCompanyId(
  token: string,
  result?: StartSesionResult | null,
): string {
  const empresa = result?.empresa
  const usuario = result?.usuario
  const claims = decodeJwtClaims(token)
  return pickCompanyCode(
    result?.companyID,
    result?.companyId,
    empresa?.companyID,
    empresa?.companyId,
    empresa?.codigo,
    empresa?.id,
    usuario?.companyID,
    usuario?.companyId,
    claims?.companyID,
    claims?.companyId,
    claims?.company,
    claims?.scope,
  )
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

  const companyId = resolveCompanyId(token, result)

  return {
    user: buildUser(username, token, result?.usuario, result?.empresa),
    token,
    nit,
    companyId,
    razonSocial: resolveRazonSocial(result?.empresa),
    loggedInAt: new Date().toISOString(),
  }
}

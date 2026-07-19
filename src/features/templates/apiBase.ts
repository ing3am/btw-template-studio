const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function isUsingMocks(): boolean {
  return useMocks
}

export function getApiBase(): string {
  if (!apiBase) {
    throw new Error('VITE_API_URL no está configurada.')
  }
  return apiBase
}

export function authHeaders(): HeadersInit {
  try {
    const raw = localStorage.getItem('btw-template-studio.auth.v1')
    if (!raw) return {}
    const session = JSON.parse(raw) as { token?: string }
    if (!session?.token) return {}
    return { Authorization: `Bearer ${session.token}` }
  } catch {
    return {}
  }
}

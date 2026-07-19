import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  loginRequest,
  readSession,
  writeSession,
} from './api'
import type { AuthSession, LoginInput } from './types'

type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  const login = useCallback(async (input: LoginInput) => {
    const next = await loginRequest(input)
    writeSession(next)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}

/** Company NIT from StartSesion (`empresa.nit`), digits only. */
export function useCompanyNit(): string {
  const { session } = useAuth()
  return (session?.nit || '').replace(/\D/g, '')
}

/** Company code from StartSesion (e.g. BYTHEWAVE). */
export function useCompanyId(): string {
  const { session } = useAuth()
  return session?.companyId?.trim() || ''
}

import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  FileText,
  LayoutTemplate,
  LoaderCircle,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { DEMO_CREDENTIALS } from '@/features/auth/api'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import styles from './LoginPage.module.css'

type LocationState = {
  from?: string
}

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: 'Diseños profesionales',
    description: 'Plantillas prediseñadas para cada necesidad.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Control total',
    description: 'Personaliza cada detalle de tu factura.',
  },
  {
    icon: ShieldCheck,
    title: 'Claridad garantizada',
    description: 'Facturas limpias, legibles y 100% confiables.',
  },
] as const

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as LocationState | null)?.from &&
    (location.state as LocationState).from !== '/login'
      ? (location.state as LocationState).from!
      : '/'

  const userId = useId()
  const passId = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Ingresa usuario y contraseña')
      return
    }

    setSubmitting(true)
    try {
      await login({ username, password })
      toast.push('Sesión iniciada', 'success')
      navigate(from, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No pudimos iniciar sesión'
      setError(message)
      toast.push(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.brand} aria-label="BTW Template Studio">
        <div className={styles.brandGlow} aria-hidden="true" />
        <div className={styles.brandTop}>
          <span className={styles.logoMark} aria-hidden="true">
            <FileText size={14} />
          </span>
          <span className={styles.logoText}>BTW</span>
        </div>

        <div className={styles.brandInner}>
          <p className={styles.eyebrow}>BTW</p>
          <h1 className={styles.brandTitle}>Template Studio</h1>
          <p className={styles.brandLead}>
            Diseña representaciones gráficas de facturación electrónica con
            control y claridad.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.title} className={styles.feature}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <p className={styles.brandFoot}>Plantillas PDF · Colombia</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelInner}>
          <header className={styles.header}>
            <p className={styles.panelEyebrow}>Acceso</p>
            <h2 className={styles.panelTitle}>Ingresar</h2>
            <p className={styles.panelLead}>
              Usa tu usuario para continuar al editor de plantillas.
            </p>
          </header>

          <form className={styles.form} onSubmit={(e) => void onSubmit(e)} noValidate>
            <label className={styles.field} htmlFor={userId}>
              <span>Usuario</span>
              <div className={styles.inputWrap}>
                <User className={styles.inputIcon} size={16} aria-hidden="true" />
                <input
                  id={userId}
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="tu.usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </label>

            <label className={styles.field} htmlFor={passId}>
              <span>Contraseña</span>
              <div className={styles.inputWrap}>
                <Lock className={styles.inputIcon} size={16} aria-hidden="true" />
                <input
                  id={passId}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  className={styles.reveal}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className={styles.submit}
              disabled={submitting}
              icon={
                submitting ? (
                  <LoaderCircle className={styles.spin} size={16} />
                ) : undefined
              }
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <aside className={styles.demo} aria-label="Credenciales de demo">
            <p>
              Demo: <strong>{DEMO_CREDENTIALS.username}</strong> /{' '}
              <strong>{DEMO_CREDENTIALS.password}</strong>
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}

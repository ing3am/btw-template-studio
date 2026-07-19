import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import styles from './AppShell.module.css'

const links = [
  { to: '/', label: 'Plantillas', end: true },
  { to: '/documentos', label: 'Documentos' },
  { to: '/branding', label: 'Branding' },
]

export function AppShell() {
  const editing = Boolean(useMatch('/templates/:id/edit'))
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const companyName = session?.razonSocial || session?.user.displayName || ''

  return (
    <div className={editing ? `${styles.shell} ${styles.shellEditing}` : styles.shell}>
      <header
        className={editing ? `${styles.topbar} ${styles.topbarEditing}` : styles.topbar}
      >
        <div className={styles.topbarLeft}>
          {!editing ? (
            <nav className={styles.nav} aria-label="Secciones principales">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <p className={styles.editingHint}>Editor</p>
          )}
        </div>

        <Link to="/" className={styles.brand} aria-label="BTW Template Studio">
          <span className={styles.brandTitle}>Template Studio</span>
          <span className={styles.brandSub}>BTW</span>
        </Link>

        <div className={styles.topbarRight}>
          {!editing && companyName ? (
            <span className={styles.userName} title={session?.nit ? `NIT ${session.nit}` : undefined}>
              {companyName}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={15} aria-hidden />
            {!editing ? <span>Salir</span> : null}
          </button>
        </div>
      </header>
      <main className={editing ? styles.mainEditing : styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

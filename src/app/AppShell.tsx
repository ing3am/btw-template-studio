import { NavLink, Outlet, useMatch } from 'react-router-dom'
import styles from './AppShell.module.css'

const links = [
  { to: '/', label: 'Plantillas', end: true },
  { to: '/branding', label: 'Branding' },
  { to: '/lab', label: 'PDF Lab' },
]

export function AppShell() {
  const editing = Boolean(useMatch('/templates/:id/edit'))

  return (
    <div className={editing ? `${styles.shell} ${styles.shellEditing}` : styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>BTW</span>
          <div>
            <strong>Template Studio</strong>
            <p>Representaciones PDF</p>
          </div>
        </div>
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
      </header>
      <main className={editing ? styles.mainEditing : styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

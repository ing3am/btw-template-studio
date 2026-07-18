import { Link, NavLink, Outlet, useMatch } from 'react-router-dom'
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
      <header
        className={editing ? `${styles.topbar} ${styles.topbarEditing}` : styles.topbar}
      >
        <Link to="/" className={styles.brand} aria-label="BTW Template Studio">
          <span className={styles.brandMark} aria-hidden="true">
            B
          </span>
          <span className={styles.brandName}>
            <span className={styles.brandProduct}>BTW</span> Template Studio
          </span>
        </Link>

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
      </header>
      <main className={editing ? styles.mainEditing : styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

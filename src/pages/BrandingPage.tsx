import styles from './Page.module.css'

export function BrandingPage() {
  return (
    <section className={`${styles.page} pageEnter`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Self-service cliente</p>
          <h1>Branding</h1>
          <p className={styles.lead}>
            Disponible después del MVP del editor (Sprint 2). Aquí el cliente
            ajustará logo, colores y tipografía.
          </p>
        </div>
      </header>
      <div className={styles.panel}>
        <p>Placeholder · aún no implementado.</p>
      </div>
    </section>
  )
}

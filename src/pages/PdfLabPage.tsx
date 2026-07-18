import styles from './Page.module.css'

export function PdfLabPage() {
  return (
    <section className={`${styles.page} pageEnter`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Demo jurado</p>
          <h1>PDF Lab</h1>
          <p className={styles.lead}>
            Consola para generar PDF desde JSON. Llega en Sprint 2 junto al
            preview PDF real.
          </p>
        </div>
      </header>
      <div className={styles.panel}>
        <p>Placeholder · aún no implementado.</p>
      </div>
    </section>
  )
}

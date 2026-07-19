import styles from './LoadingState.module.css'

type LoadingVariant = 'full' | 'inline' | 'overlay'

type LoadingStateProps = {
  variant?: LoadingVariant
  /** Texto visible; por defecto “Cargando…” (es-CO). */
  label?: string
  className?: string
}

export function LoadingState({
  variant = 'full',
  label = 'Cargando…',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={[styles.root, styles[variant], className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.stage} aria-hidden>
        <span className={styles.glow} />
        <span className={styles.orbit} />
        <span className={styles.mark}>
          <span className={styles.markText}>BTW</span>
          <span className={styles.shimmer} />
        </span>
      </div>
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  )
}

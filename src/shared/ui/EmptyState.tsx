import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.orb} aria-hidden>
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

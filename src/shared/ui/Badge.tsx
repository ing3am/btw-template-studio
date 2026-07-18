import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning'
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

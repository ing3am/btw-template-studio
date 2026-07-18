import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: ReactNode
  hint?: string
}

export function Button({
  variant = 'primary',
  icon,
  hint,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {hint ? <kbd className={styles.hint}>{hint}</kbd> : null}
    </button>
  )
}

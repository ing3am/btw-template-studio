import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import styles from './CreateTemplateDialog.module.css'

type ImportTemplateDialogProps = {
  open: boolean
  busy: boolean
  /** Prefill from export `template.name`. */
  defaultName: string
  onClose: () => void
  onImport: (name: string) => void
}

export function ImportTemplateDialog({
  open,
  busy,
  defaultName,
  onClose,
  onImport,
}: ImportTemplateDialogProps) {
  const titleId = useId()
  const descId = useId()
  const hintId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    if (!open) return
    setName(defaultName)
    const t = window.setTimeout(() => {
      nameRef.current?.focus()
      nameRef.current?.select()
    }, 30)
    return () => window.clearTimeout(t)
  }, [defaultName, open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [busy, onClose, open])

  if (!open) return null

  const trimmed = name.trim()
  const canImport = trimmed.length >= 1

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descId} ${hintId}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Importar</p>
          <h2 id={titleId}>Importar plantilla</h2>
          <p id={descId}>Revisa el nombre antes de confirmar. Puedes cambiarlo ahora.</p>
        </header>

        <label className={styles.field}>
          <span>Nombre de la plantilla</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            required
            aria-required
            disabled={busy}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canImport && !busy) {
                event.preventDefault()
                onImport(trimmed)
              }
            }}
          />
        </label>

        <p id={hintId} className={styles.hint}>
          Se importará como borrador. Tú decides cuándo publicarla.
        </p>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || !canImport}
            onClick={() => onImport(trimmed)}
          >
            {busy ? 'Importando…' : 'Importar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

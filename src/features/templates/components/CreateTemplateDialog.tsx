import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DocumentType } from '../types'
import { Button } from '@/shared/ui/Button'
import styles from './CreateTemplateDialog.module.css'

export type CreateTemplateFormValue = {
  name: string
  documentType: DocumentType
  nit: string
  sectorSalud: boolean
}

type CreateTemplateDialogProps = {
  open: boolean
  busy: boolean
  nit: string
  razonSocial?: string
  onClose: () => void
  onCreate: (value: CreateTemplateFormValue) => void
}

export function CreateTemplateDialog({
  open,
  busy,
  nit,
  razonSocial,
  onClose,
  onCreate,
}: CreateTemplateDialogProps) {
  const titleId = useId()
  const descId = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('Nueva factura')
  const [documentType, setDocumentType] = useState<DocumentType>('factura')
  const [sectorSalud, setSectorSalud] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('Nueva factura')
    setDocumentType('factura')
    setSectorSalud(false)
    const t = window.setTimeout(() => nameRef.current?.focus(), 30)
    return () => window.clearTimeout(t)
  }, [open])

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

  const companyNit = nit.trim()
  const canCreate = name.trim().length >= 3 && companyNit.length >= 5

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
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <p className={styles.kicker}>Nueva</p>
          <h2 id={titleId}>Crear plantilla</h2>
          <p id={descId}>
            Define el nombre y el tipo. El NIT queda anclado a tu empresa de sesión.
          </p>
        </header>

        <label className={styles.field}>
          <span>Nombre</span>
          <input
            ref={nameRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </label>

        <label className={styles.field}>
          <span>Tipo documental</span>
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          >
            <option value="factura">Factura</option>
            <option value="nota_credito">Nota crédito</option>
            <option value="nota_debito">Nota débito</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <div className={styles.field}>
          <span>NIT de la empresa</span>
          <div className={styles.readonlyBox} aria-live="polite">
            <strong>{companyNit || 'Sin NIT en sesión'}</strong>
            {razonSocial ? <em>{razonSocial}</em> : null}
          </div>
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={sectorSalud}
            onChange={(event) => setSectorSalud(event.target.checked)}
          />
          <span>Incluir bloques de sector salud</span>
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || !canCreate}
            onClick={() =>
              onCreate({
                name: name.trim(),
                documentType,
                nit: companyNit,
                sectorSalud,
              })
            }
          >
            {busy ? 'Creando…' : 'Crear plantilla'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

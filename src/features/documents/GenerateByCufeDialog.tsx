import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, LoaderCircle } from 'lucide-react'
import type { DocumentType } from '@/features/templates/types'
import { Button } from '@/shared/ui/Button'
import styles from './GenerateByCufeDialog.module.css'

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'factura', label: 'Factura' },
  { value: 'nota_credito', label: 'Nota crédito' },
  { value: 'nota_debito', label: 'Nota débito' },
]

type GenerateByCufeDialogProps = {
  open: boolean
  busy?: boolean
  onClose: () => void
  onSubmit: (value: { cufe: string; documentType: DocumentType }) => void
}

export function GenerateByCufeDialog({
  open,
  busy = false,
  onClose,
  onSubmit,
}: GenerateByCufeDialogProps) {
  const titleId = useId()
  const descId = useId()
  const cufeRef = useRef<HTMLInputElement>(null)
  const [cufe, setCufe] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('factura')

  useEffect(() => {
    if (!open) return
    setCufe('')
    setDocumentType('factura')
    const t = window.setTimeout(() => cufeRef.current?.focus(), 30)
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

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = cufe.trim()
          if (!trimmed) return
          onSubmit({ cufe: trimmed, documentType })
        }}
      >
        <h2 id={titleId}>Generar por CUFE</h2>
        <p id={descId}>
          Si ya tienes el código de la factura, pégalo aquí. No necesitas buscar
          por fecha.
        </p>

        <label className={styles.field}>
          <span>Tipo de documento</span>
          <select
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as DocumentType)
            }
            disabled={busy}
          >
            {DOC_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>CUFE</span>
          <input
            ref={cufeRef}
            value={cufe}
            onChange={(event) => setCufe(event.target.value)}
            placeholder="Pega el código completo"
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={busy || !cufe.trim()}
            icon={
              busy ? (
                <LoaderCircle size={16} className={styles.spin} />
              ) : (
                <FileText size={16} />
              )
            }
          >
            {busy ? 'Abriendo…' : 'Continuar'}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

import { useState } from 'react'
import type { DocumentType } from '../types'
import { Button } from '@/shared/ui/Button'
import styles from './CreateTemplateDialog.module.css'

type CreateTemplateDialogProps = {
  open: boolean
  busy: boolean
  onClose: () => void
  onCreate: (name: string, documentType: DocumentType) => void
}

export function CreateTemplateDialog({
  open,
  busy,
  onClose,
  onCreate,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState('Nueva factura')
  const [documentType, setDocumentType] = useState<DocumentType>('factura')

  if (!open) return null

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-template-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="create-template-title">Nueva plantilla</h2>
        <p>Define el nombre y el tipo documental para empezar a editar.</p>

        <label className={styles.field}>
          <span>Nombre</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
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

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || name.trim().length < 3}
            onClick={() => onCreate(name.trim(), documentType)}
          >
            {busy ? 'Creando…' : 'Crear'}
          </Button>
        </div>
      </div>
    </div>
  )
}

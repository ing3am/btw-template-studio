import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, LoaderCircle, Upload, X } from 'lucide-react'
import { BRAND_ASSET_MAX_BYTES } from '../brandAssetsApi'
import { Button } from '@/shared/ui/Button'
import styles from './UploadBrandAssetDialog.module.css'

type UploadBrandAssetDialogProps = {
  open: boolean
  busy?: boolean
  onClose: () => void
  onUpload: (file: File) => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadBrandAssetDialog({
  open,
  busy = false,
  onClose,
  onUpload,
}: UploadBrandAssetDialogProps) {
  const titleId = useId()
  const descId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreviewUrl(null)
      setError('')
      setDragging(false)
      return
    }
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function pickFile(next: File | null | undefined) {
    if (!next) return
    setError('')
    if (!next.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.')
      setFile(null)
      return
    }
    if (next.size > BRAND_ASSET_MAX_BYTES) {
      setError(`La imagen supera 1.5 MB (${formatBytes(next.size)}).`)
      setFile(null)
      return
    }
    setFile(next)
  }

  if (!open) return null

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
          <div>
            <p className={styles.kicker}>Biblioteca</p>
            <h2 id={titleId}>Subir imagen</h2>
            <p id={descId}>
              PNG, JPG o WebP. Máximo 1.5 MB. Se asociará a tu empresa de sesión.
            </p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''} ${file ? styles.dropzoneFilled : ''}`}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            pickFile(event.dataTransfer.files?.[0])
          }}
        >
          {previewUrl && file ? (
            <div className={styles.preview}>
              <img src={previewUrl} alt={file.name} />
              <div className={styles.previewMeta}>
                <strong title={file.name}>{file.name}</strong>
                <span>
                  {formatBytes(file.size)} · {file.type || 'imagen'}
                </span>
                <button
                  type="button"
                  className={styles.changeBtn}
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  Cambiar archivo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.dropAction}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <span className={styles.dropIcon} aria-hidden>
                <Upload size={22} />
              </span>
              <strong>Arrastra una imagen aquí</strong>
              <span>o haz clic para seleccionarla</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(event) => {
              pickFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            icon={busy ? <LoaderCircle className={styles.spin} size={16} /> : <ImagePlus size={16} />}
            disabled={busy || !file}
            onClick={() => {
              if (file) onUpload(file)
            }}
          >
            {busy ? 'Subiendo…' : 'Subir a la biblioteca'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

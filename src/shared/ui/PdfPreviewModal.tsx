import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { Download, ExternalLink, FileText, LoaderCircle, X } from 'lucide-react'
import { Button } from './Button'
import styles from './PdfPreviewModal.module.css'

type PdfPreviewModalProps = {
  open: boolean
  onClose: () => void
  loading: boolean
  error: string | null
  previewUrl: string | null
  fileName?: string | null
  title: string
  subtitle?: string | null
}

export function PdfPreviewModal({
  open,
  onClose,
  loading,
  error,
  previewUrl,
  fileName,
  title,
  subtitle,
}: PdfPreviewModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [loading, onClose, open])

  if (!open) return null

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <div className={styles.headerActions}>
            {previewUrl ? (
              <>
                <a
                  className={styles.linkBtn}
                  href={previewUrl}
                  download={fileName || 'documento.pdf'}
                >
                  <Download size={15} aria-hidden />
                  Descargar
                </a>
                <a
                  className={styles.linkBtn}
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} aria-hidden />
                  Abrir
                </a>
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              icon={<X size={16} />}
              onClick={onClose}
              disabled={loading}
              aria-label="Cerrar"
            >
              Cerrar
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.state}>
              <LoaderCircle className={styles.spin} size={22} />
              <p>Generando el PDF con la plantilla publicada…</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className={styles.state}>
              <FileText size={22} aria-hidden />
              <p className={styles.errorText}>{error}</p>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : null}

          {!loading && !error && previewUrl ? (
            <iframe
              title="Vista previa PDF"
              src={previewUrl}
              className={styles.frame}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

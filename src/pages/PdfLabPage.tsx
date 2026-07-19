import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react'
import { useAuth, useCompanyNit } from '@/features/auth/AuthProvider'
import { generatePdfByCufe } from '@/features/templates/api'
import { pdfBase64ToObjectUrl } from '@/shared/lib/pdf'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import styles from './PdfLabPage.module.css'

export function PdfLabPage() {
  const toast = useToast()
  const { session } = useAuth()
  const nit = useCompanyNit()
  const [cufe, setCufe] = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCufe, setLastCufe] = useState<string | null>(null)

  const previewUrl = useMemo(
    () => (pdfBase64 ? pdfBase64ToObjectUrl(pdfBase64) : null),
    [pdfBase64],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = cufe.trim()
    if (!trimmed) {
      setError('Ingresa el CUFE de la factura.')
      return
    }
    if (!nit) {
      setError('No hay NIT en la sesión. Vuelve a iniciar sesión.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await generatePdfByCufe({
        nit,
        cufe: trimmed,
        documentType: 'factura',
      })
      setPdfBase64(result.pdfBase64)
      setFileName(result.fileName)
      setLastCufe(trimmed)
      toast.push('PDF generado', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No pudimos generar el PDF.'
      setError(message)
      setPdfBase64(null)
      setFileName(null)
      setLastCufe(null)
      toast.push(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function clearResult() {
    setPdfBase64(null)
    setFileName(null)
    setLastCufe(null)
    setError(null)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Prueba con factura real</p>
          <h1 className={styles.title}>PDF Lab</h1>
          <p className={styles.lead}>
            Pega un CUFE, genera el PDF con la plantilla publicada de tu empresa
            y revísalo aquí antes de usarlo en producción.
          </p>
        </div>
      </header>

      <div className={styles.summary}>
        <div className={styles.company}>
          <span className={styles.companyLabel}>Empresa</span>
          <strong className={styles.companyName}>
            {session?.razonSocial || 'Sin razón social'}
          </strong>
          <span className={styles.companyNit}>NIT {nit || '—'}</span>
        </div>
        <div className={styles.hintCard}>
          <span className={styles.companyLabel}>Cómo funciona</span>
          <p>
            El lab consulta el UBL por CUFE, aplica la plantilla publicada de
            factura y te muestra el resultado listo para descargar.
          </p>
        </div>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.controls}>
          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
            <div className={styles.formHead}>
              <h2>Generar</h2>
              <p>Usa el CUFE / CUDE exacto de la factura electrónica.</p>
            </div>

            <label className={styles.field}>
              <span>CUFE</span>
              <textarea
                value={cufe}
                onChange={(event) => setCufe(event.target.value)}
                placeholder="Pega aquí el CUFE completo"
                autoComplete="off"
                spellCheck={false}
                disabled={loading || !nit}
                rows={4}
              />
            </label>

            <p className={styles.cufeMeta} aria-live="polite">
              {cufe.trim().length > 0
                ? `${cufe.trim().length} caracteres`
                : 'Sin CUFE aún'}
            </p>

            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.actions}>
              <Button
                type="submit"
                disabled={loading || !cufe.trim() || !nit}
                icon={
                  loading ? (
                    <LoaderCircle size={16} className={styles.spin} />
                  ) : (
                    <FileText size={16} />
                  )
                }
              >
                {loading ? 'Generando…' : 'Generar PDF'}
              </Button>
              {pdfBase64 ? (
                <Button
                  type="button"
                  variant="ghost"
                  icon={<RotateCcw size={16} />}
                  onClick={clearResult}
                  disabled={loading}
                >
                  Limpiar
                </Button>
              ) : null}
            </div>
          </form>
        </aside>

        <div className={styles.previewPanel}>
          {previewUrl ? (
            <>
              <div className={styles.previewMeta}>
                <div className={styles.previewInfo}>
                  <strong title={fileName ?? undefined}>
                    {fileName ?? 'documento.pdf'}
                  </strong>
                  {lastCufe ? (
                    <span title={lastCufe}>
                      CUFE · {lastCufe.slice(0, 18)}
                      {lastCufe.length > 18 ? '…' : ''}
                    </span>
                  ) : null}
                </div>
                <div className={styles.previewActions}>
                  <a
                    className={styles.previewLink}
                    href={previewUrl}
                    download={fileName ?? 'fe.pdf'}
                  >
                    <Download size={15} aria-hidden />
                    Descargar
                  </a>
                  <a
                    className={styles.previewLink}
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={15} aria-hidden />
                    Abrir
                  </a>
                </div>
              </div>
              <iframe
                title="Vista previa PDF"
                src={previewUrl}
                className={styles.previewFrame}
              />
            </>
          ) : loading ? (
            <div className={styles.loadingState}>
              <LoaderCircle className={styles.spin} size={22} />
              <p>Generando el PDF con la plantilla publicada…</p>
            </div>
          ) : (
            <EmptyState
              title="Sin vista previa"
              description={
                nit
                  ? 'Genera un PDF con un CUFE válido para verlo aquí.'
                  : 'Inicia sesión de nuevo para usar el NIT de tu empresa.'
              }
              icon={<FileText size={22} />}
            />
          )}
        </div>
      </div>
    </section>
  )
}

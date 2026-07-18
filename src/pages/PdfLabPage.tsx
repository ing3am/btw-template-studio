import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { FileText, LoaderCircle } from 'lucide-react'
import { generatePdfByCufe } from '@/features/templates/api'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import pageStyles from './Page.module.css'
import styles from './PdfLabPage.module.css'

const DEFAULT_NIT = '900000000'

function pdfObjectUrl(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

export function PdfLabPage() {
  const toast = useToast()
  const [cufe, setCufe] = useState('')
  const [nit, setNit] = useState(DEFAULT_NIT)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(
    () => (pdfBase64 ? pdfObjectUrl(pdfBase64) : null),
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

    setLoading(true)
    setError(null)
    try {
      const result = await generatePdfByCufe({
        nit: nit.trim() || DEFAULT_NIT,
        cufe: trimmed,
        documentType: 'factura',
      })
      setPdfBase64(result.pdfBase64)
      setFileName(result.fileName)
      toast.push('PDF generado', 'success')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No pudimos generar el PDF.'
      setError(message)
      setPdfBase64(null)
      setFileName(null)
      toast.push(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`${pageStyles.page} ${styles.lab} pageEnter`}>
      <header className={pageStyles.header}>
        <div>
          <p className={pageStyles.eyebrow}>Prueba con factura real</p>
          <h1>PDF Lab</h1>
          <p className={pageStyles.lead}>
            Envía el CUFE; el backend consulta el UBL, aplica la plantilla
            publicada y devuelve el PDF en Base64 para previsualizarlo aquí.
          </p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>CUFE</span>
          <input
            value={cufe}
            onChange={(event) => setCufe(event.target.value)}
            placeholder="Pega el CUFE / CUDE de la factura"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
        </label>

        <label className={styles.fieldCompact}>
          <span>NIT (plantilla publicada)</span>
          <input
            value={nit}
            onChange={(event) => setNit(event.target.value)}
            placeholder={DEFAULT_NIT}
            inputMode="numeric"
            disabled={loading}
          />
        </label>

        <div className={styles.actions}>
          <Button
            type="submit"
            disabled={loading || !cufe.trim()}
            icon={
              loading ? (
                <LoaderCircle size={16} className={pageStyles.spin} />
              ) : (
                <FileText size={16} />
              )
            }
          >
            {loading ? 'Generando…' : 'Generar PDF'}
          </Button>
        </div>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.previewPanel}>
        {previewUrl ? (
          <>
            <div className={styles.previewMeta}>
              <span>{fileName ?? 'documento.pdf'}</span>
              <a href={previewUrl} download={fileName ?? 'fe.pdf'}>
                Descargar
              </a>
            </div>
            <iframe
              title="Vista previa PDF"
              src={previewUrl}
              className={styles.previewFrame}
            />
          </>
        ) : (
          <p className={styles.placeholder}>
            El PDF aparecerá aquí cuando la API responda el Base64.
          </p>
        )}
      </div>
    </section>
  )
}

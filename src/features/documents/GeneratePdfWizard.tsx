import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  History,
  Layers,
  LoaderCircle,
  RefreshCw,
  X,
} from 'lucide-react'
import type { InvoiceRow } from '@/features/documents/api'
import {
  generatePdfByCufe,
  getInvoiceTemplateBinding,
  listTemplates,
  type InvoiceTemplateBinding,
} from '@/features/templates/api'
import type { DocumentType, Template } from '@/features/templates/types'
import { pdfBase64ToObjectUrl } from '@/shared/lib/pdf'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import styles from './GeneratePdfWizard.module.css'

type Step =
  | 'checking'
  | 'choose'
  | 'pickTemplate'
  | 'confirmReplace'
  | 'generating'
  | 'preview'
  | 'error'

type GeneratePdfWizardProps = {
  open: boolean
  row: InvoiceRow | null
  nit: string
  documentType: DocumentType
  onClose: () => void
  onBusyChange?: (busy: boolean) => void
}

function shortId(value: string | null | undefined): string {
  if (!value) return '—'
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}…`
}

function formatBoundAt(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function sameTemplateId(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export function GeneratePdfWizard({
  open,
  row,
  nit,
  documentType,
  onClose,
  onBusyChange,
}: GeneratePdfWizardProps) {
  const toast = useToast()
  const titleId = useId()

  const [step, setStep] = useState<Step>('checking')
  const [binding, setBinding] = useState<InvoiceTemplateBinding | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [resultTemplateId, setResultTemplateId] = useState<string | null>(null)
  const [resultTemplateVersion, setResultTemplateVersion] = useState<
    number | null
  >(null)

  const previewUrl = useMemo(
    () => (pdfBase64 ? pdfBase64ToObjectUrl(pdfBase64, fileName ?? undefined) : null),
    [pdfBase64, fileName],
  )

  const busy = step === 'checking' || step === 'generating'

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  const reset = useCallback(() => {
    setStep('checking')
    setBinding(null)
    setTemplates([])
    setSelectedTemplateId(null)
    setError(null)
    setPdfBase64(null)
    setFileName(null)
    setResultTemplateId(null)
    setResultTemplateVersion(null)
  }, [])

  const close = useCallback(() => {
    if (busy) return
    reset()
    onClose()
  }, [busy, onClose, reset])

  const applyResultMeta = useCallback(
    (
      result: Awaited<ReturnType<typeof generatePdfByCufe>>,
      options?: { replaceBinding?: boolean },
    ) => {
      setResultTemplateId(result.templateId)
      setResultTemplateVersion(result.templateVersion)

      if (options?.replaceBinding === true || result.bindingReplaced) {
        setBinding({
          exists: true,
          nit: result.nit,
          cufe: result.cufe,
          documentType: result.documentType,
          templateId: result.templateId,
          templateVersion: result.templateVersion,
          boundAt: new Date().toISOString(),
        })
        return
      }

      if (!options?.replaceBinding) {
        setBinding((prev) => {
          if (prev?.exists) return prev
          return {
            exists: true,
            nit: result.nit,
            cufe: result.cufe,
            documentType: result.documentType,
            templateId: result.templateId,
            templateVersion: result.templateVersion,
            boundAt: new Date().toISOString(),
          }
        })
      }
    },
    [],
  )

  const runGenerate = useCallback(
    async (options?: { templateId?: string; replaceBinding?: boolean }) => {
      if (!row?.cufe || !nit) return

      const requestedTemplateId = options?.templateId?.trim() || undefined
      if (options?.replaceBinding === true && !requestedTemplateId) {
        const message =
          'Selecciona una plantilla antes de reemplazar el binding.'
        setError(message)
        setStep('error')
        toast.push(message, 'error')
        return
      }

      setStep('generating')
      setError(null)
      setPdfBase64(null)
      setFileName(null)
      setResultTemplateId(null)
      setResultTemplateVersion(null)
      try {
        const result = await generatePdfByCufe({
          nit,
          cufe: row.cufe,
          documentType,
          templateId: requestedTemplateId,
          replaceBinding: options?.replaceBinding,
        })

        // Replace path must not silently fall back to the pinned template.
        if (options?.replaceBinding === true) {
          const reusedPin = result.reusedPinnedTemplate === true
          const wrongTemplate =
            !!requestedTemplateId &&
            !sameTemplateId(result.templateId, requestedTemplateId)
          if (reusedPin || wrongTemplate) {
            const message =
              'La API no reemplazó el binding: siguió con la plantilla pinneada. Intenta de nuevo o revisa que la plantilla esté publicada.'
            setError(message)
            setStep('error')
            toast.push(message, 'error')
            return
          }
        }

        setPdfBase64(result.pdfBase64)
        setFileName(result.fileName)
        applyResultMeta(result, options)
        setStep('preview')

        const versionLabel = `v${result.templateVersion}`
        const plantillaLabel = shortId(result.templateId)
        if (result.bindingReplaced) {
          toast.push(
            `PDF regenerado · plantilla ${plantillaLabel} ${versionLabel} (binding actualizado)`,
            'success',
          )
        } else if (result.reusedPinnedTemplate) {
          toast.push(
            `PDF con la versión original · plantilla ${plantillaLabel} ${versionLabel}`,
            'success',
          )
        } else {
          toast.push(
            `PDF generado · plantilla ${plantillaLabel} ${versionLabel}`,
            'success',
          )
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No pudimos generar el PDF.'
        setError(message)
        setStep('error')
        toast.push(message, 'error')
      }
    },
    [applyResultMeta, documentType, nit, row, toast],
  )

  const loadPublishedTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setError(null)
    try {
      const all = await listTemplates(nit)
      const published = all.filter(
        (t) =>
          t.documentType === documentType &&
          (t.publishedVersionNumber ?? 0) > 0,
      )
      setTemplates(published)
      setSelectedTemplateId(published[0]?.id ?? null)
      setStep('pickTemplate')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No pudimos cargar las plantillas.'
      setError(message)
      setStep('error')
      toast.push(message, 'error')
    } finally {
      setTemplatesLoading(false)
    }
  }, [documentType, nit, toast])

  useEffect(() => {
    if (!open || !row?.cufe || !nit) return

    let cancelled = false
    setStep('checking')
    setBinding(null)
    setTemplates([])
    setSelectedTemplateId(null)
    setError(null)
    setPdfBase64(null)
    setFileName(null)
    setResultTemplateId(null)
    setResultTemplateVersion(null)

    void (async () => {
      try {
        const found = await getInvoiceTemplateBinding(nit, row.cufe)
        if (cancelled) return
        setBinding(found)
        if (!found.exists) {
          setStep('generating')
          try {
            const result = await generatePdfByCufe({
              nit,
              cufe: row.cufe,
              documentType,
            })
            if (cancelled) return
            setPdfBase64(result.pdfBase64)
            setFileName(result.fileName)
            setResultTemplateId(result.templateId)
            setResultTemplateVersion(result.templateVersion)
            setBinding({
              exists: true,
              nit: result.nit,
              cufe: result.cufe,
              documentType: result.documentType,
              templateId: result.templateId,
              templateVersion: result.templateVersion,
              boundAt: new Date().toISOString(),
            })
            setStep('preview')
            toast.push(
              `PDF generado · plantilla ${shortId(result.templateId)} v${result.templateVersion}`,
              'success',
            )
          } catch (err) {
            if (cancelled) return
            const message =
              err instanceof Error ? err.message : 'No pudimos generar el PDF.'
            setError(message)
            setStep('error')
            toast.push(message, 'error')
          }
          return
        }
        setStep('choose')
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : 'No pudimos consultar el historial del PDF.'
        setError(message)
        setStep('error')
        toast.push(message, 'error')
      }
    })()

    return () => {
      cancelled = true
    }
    // Only re-run when opening for a specific invoice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.id, row?.cufe, nit, documentType])


  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) close()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [busy, close, open])

  if (!open || !row) return null

  const title =
    step === 'preview'
      ? `Factura ${row.numero}`
      : step === 'choose' || step === 'pickTemplate' || step === 'confirmReplace'
        ? 'Documento ya graficado'
        : 'Generar PDF'

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => {
        if (!busy) close()
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
            <p className={styles.eyebrow}>
              {row.legalNum !== '—'
                ? row.legalNum
                : row.numero !== '—'
                  ? `Factura ${row.numero}`
                  : 'Generar por CUFE'}
            </p>
            <h2 id={titleId}>{title}</h2>
            <p className={styles.subtitle} title={row.cufe}>
              CUFE · {row.cufe}
            </p>
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
              onClick={close}
              disabled={busy}
              aria-label="Cerrar"
            >
              Cerrar
            </Button>
          </div>
        </header>

        <div className={styles.body}>
          {step === 'checking' || step === 'generating' || templatesLoading ? (
            <div className={styles.state}>
              <LoaderCircle className={styles.spin} size={24} />
              <p>
                {step === 'checking'
                  ? 'Buscando si este documento ya fue graficado…'
                  : templatesLoading
                    ? 'Cargando plantillas publicadas…'
                    : 'Generando el PDF…'}
              </p>
            </div>
          ) : null}

          {step === 'choose' && binding ? (
            <div className={styles.panel}>
              <div className={styles.notice}>
                <History size={20} aria-hidden />
                <div>
                  <strong>Este documento ya se generó una vez</strong>
                  <p>
                    Puedes re-graficarlo con la versión original pinneada, o
                    elegir otra plantilla publicada.
                  </p>
                </div>
              </div>

              <dl className={styles.metaGrid}>
                <div>
                  <dt>Plantilla pinneada</dt>
                  <dd>{shortId(binding.templateId)}</dd>
                </div>
                <div>
                  <dt>Versión</dt>
                  <dd>v{binding.templateVersion ?? '—'}</dd>
                </div>
                <div>
                  <dt>Graficado</dt>
                  <dd>{formatBoundAt(binding.boundAt)}</dd>
                </div>
              </dl>

              <div className={styles.choiceGrid}>
                <button
                  type="button"
                  className={styles.choiceCard}
                  onClick={() => void runGenerate()}
                >
                  <RefreshCw size={18} aria-hidden />
                  <strong>Usar versión original</strong>
                  <span>Re-grafica con la plantilla y versión pinneadas.</span>
                </button>
                <button
                  type="button"
                  className={styles.choiceCard}
                  onClick={() => void loadPublishedTemplates()}
                >
                  <Layers size={18} aria-hidden />
                  <strong>Elegir otra plantilla</strong>
                  <span>Selecciona una plantilla publicada distinta.</span>
                </button>
              </div>
            </div>
          ) : null}

          {step === 'pickTemplate' ? (
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h3>Plantillas publicadas</h3>
                <p>
                  Solo se listan plantillas de tipo{' '}
                  <strong>{documentType}</strong> con versión publicada.
                </p>
              </div>

              {templates.length === 0 ? (
                <div className={styles.emptyTemplates}>
                  <FileText size={22} aria-hidden />
                  <p>No hay otras plantillas publicadas para este tipo.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep('choose')}
                  >
                    Volver
                  </Button>
                </div>
              ) : (
                <>
                  <ul className={styles.templateList}>
                    {templates.map((template) => {
                      const selected = template.id === selectedTemplateId
                      const isPinned = template.id === binding?.templateId
                      return (
                        <li key={template.id}>
                          <button
                            type="button"
                            className={`${styles.templateItem} ${selected ? styles.templateItemSelected : ''}`}
                            onClick={() => setSelectedTemplateId(template.id)}
                          >
                            <span className={styles.templateCheck} aria-hidden>
                              {selected ? <Check size={14} /> : null}
                            </span>
                            <span className={styles.templateCopy}>
                              <strong>{template.name}</strong>
                              <em>
                                Publicada v{template.publishedVersionNumber}
                                {isPinned ? ' · pin actual' : ''}
                              </em>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  <div className={styles.footerActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep('choose')}
                    >
                      Atrás
                    </Button>
                    <Button
                      type="button"
                      disabled={!selectedTemplateId}
                      onClick={() => setStep('confirmReplace')}
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {step === 'confirmReplace' ? (
            <div className={styles.panel}>
              <div className={styles.notice}>
                <Layers size={20} aria-hidden />
                <div>
                  <strong>¿Reemplazar el original?</strong>
                  <p>
                    Elegiste{' '}
                    <em>{selectedTemplate?.name ?? 'una plantilla'}</em>. Decide
                    si el nuevo PDF pasa a ser la versión oficial pinneada o
                    solo una generación puntual.
                  </p>
                </div>
              </div>

              <div className={styles.choiceGrid}>
                <button
                  type="button"
                  className={styles.choiceCard}
                  disabled={!selectedTemplateId}
                  onClick={() => {
                    if (!selectedTemplateId) return
                    void runGenerate({
                      templateId: selectedTemplateId,
                      replaceBinding: true,
                    })
                  }}
                >
                  <RefreshCw size={18} aria-hidden />
                  <strong>Reemplazar el original</strong>
                  <span>
                    Actualiza el binding: futuras re-gráficas usarán esta
                    plantilla.
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.choiceCard}
                  disabled={!selectedTemplateId}
                  onClick={() => {
                    if (!selectedTemplateId) return
                    void runGenerate({
                      templateId: selectedTemplateId,
                      replaceBinding: false,
                    })
                  }}
                >
                  <FileText size={18} aria-hidden />
                  <strong>Solo generar PDF</strong>
                  <span>
                    Genera el PDF sin reemplazar el pin original.
                  </span>
                </button>
              </div>

              <div className={styles.footerActions}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('pickTemplate')}
                >
                  Atrás
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'preview' && previewUrl ? (
            <div className={styles.previewWrap}>
              <div className={styles.previewMeta} aria-live="polite">
                <span>Plantilla {shortId(resultTemplateId)}</span>
                <span aria-hidden>·</span>
                <span>Versión v{resultTemplateVersion ?? '—'}</span>
              </div>
              <iframe
                title="Vista previa PDF"
                src={previewUrl}
                className={styles.frame}
              />
            </div>
          ) : null}

          {step === 'error' ? (
            <div className={styles.state}>
              <FileText size={22} aria-hidden />
              <p className={styles.errorText}>{error}</p>
              <div className={styles.footerActions}>
                <Button type="button" variant="ghost" onClick={close}>
                  Cerrar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    reset()
                    void (async () => {
                      try {
                        const found = await getInvoiceTemplateBinding(
                          nit,
                          row.cufe,
                        )
                        setBinding(found)
                        if (!found.exists) {
                          await runGenerate()
                          return
                        }
                        setStep('choose')
                      } catch (err) {
                        const message =
                          err instanceof Error
                            ? err.message
                            : 'No pudimos reintentar.'
                        setError(message)
                        setStep('error')
                      }
                    })()
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

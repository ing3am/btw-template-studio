import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  LoaderCircle,
  Save,
  UploadCloud,
  AlertTriangle,
  Code2,
  LayoutTemplate,
} from 'lucide-react'
import { CodeEditor } from '@/features/editor/CodeEditor'
import { PreviewHtml } from '@/features/editor/PreviewHtml'
import { getLatestVersion } from '@/features/templates/api'
import {
  usePublishTemplate,
  useSaveDraft,
  useTemplateBundle,
} from '@/features/templates/hooks'
import { VisualBuilder } from '@/features/visual-builder/VisualBuilder'
import { missingRequiredLabels } from '@/features/visual-builder/dianPresence'
import { migrateTemplateBlocks } from '@/features/visual-builder/migrateBlocks'
import {
  createDefaultFacturaBlocks,
  type TemplateBlock,
} from '@/features/visual-builder/types'
import {
  parseAssetsJson,
  serializeAssetsJson,
  type TemplateAsset,
} from '@/features/templates/templateAssets'
import { serializeBlocksToDocument } from '@/features/visual-builder/serializeToHtml'
import {
  defaultPageSettings,
  parsePageSettingsFromCss,
  type PageSettings,
} from '@/features/visual-builder/pageSettings'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import styles from './TemplateEditorPage.module.css'

type Mode = 'visual' | 'advanced'

function parseBlocks(blocksJson: string | undefined): TemplateBlock[] {
  if (!blocksJson) return createDefaultFacturaBlocks()
  try {
    const parsed = JSON.parse(blocksJson) as TemplateBlock[]
    return Array.isArray(parsed) && parsed.length > 0
      ? migrateTemplateBlocks(parsed)
      : createDefaultFacturaBlocks()
  } catch {
    return createDefaultFacturaBlocks()
  }
}

export function TemplateEditorPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useTemplateBundle(id)
  const saveDraft = useSaveDraft(id)
  const publish = usePublishTemplate(id)

  const [mode, setMode] = useState<Mode>('visual')
  const [advancedTab, setAdvancedTab] = useState<'html' | 'css' | 'sample'>('sample')
  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  const [page, setPage] = useState<PageSettings>(defaultPageSettings)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [schemaJson, setSchemaJson] = useState('')
  const [sampleDataJson, setSampleDataJson] = useState('')
  const [baseline, setBaseline] = useState('')
  const [statusText, setStatusText] = useState('Listo')
  const [assets, setAssets] = useState<TemplateAsset[]>([])
  const hydratedKeyRef = useRef('')
  const skipHydrateRef = useRef(false)

  useEffect(() => {
    if (!data) return
    const version = getLatestVersion(data)
    const hydrateKey = `${data.template.id}:${version.id}:${version.versionNumber}:${data.template.status}`

    if (skipHydrateRef.current) {
      skipHydrateRef.current = false
      hydratedKeyRef.current = hydrateKey
      setStatusText(
        data.template.status === 'published'
          ? `Publicada · v${data.template.currentVersionNumber}`
          : `Borrador · v${data.template.currentVersionNumber}`,
      )
      return
    }

    if (hydratedKeyRef.current === hydrateKey) return
    hydratedKeyRef.current = hydrateKey

    const nextBlocks = parseBlocks(version.blocksJson)
    const nextPage = parsePageSettingsFromCss(version.css)
    const serialized = serializeBlocksToDocument(nextBlocks, nextPage)
    const nextAssets = parseAssetsJson(data.template.id, version.assetsJson)
    const nextHtml = version.blocksJson ? serialized.html : version.html || serialized.html
    const nextCss = version.blocksJson ? serialized.css : version.css || serialized.css
    setBlocks(nextBlocks)
    setPage(nextPage)
    setHtml(nextHtml)
    setCss(nextCss)
    setSchemaJson(version.schemaJson)
    setSampleDataJson(version.sampleDataJson)
    setAssets(nextAssets)
    setBaseline(
      JSON.stringify({
        blocksJson: JSON.stringify(nextBlocks),
        html: nextHtml,
        css: nextCss,
        schemaJson: version.schemaJson,
        sampleDataJson: version.sampleDataJson,
        assetsJson: serializeAssetsJson(nextAssets),
      }),
    )
    setStatusText(
      data.template.status === 'published'
        ? `Publicada · v${data.template.currentVersionNumber}`
        : `Borrador · v${data.template.currentVersionNumber}`,
    )
  }, [data])

  const applyBlocks = useCallback(
    (next: TemplateBlock[]) => {
      setBlocks(next)
      const serialized = serializeBlocksToDocument(next, page)
      setHtml(serialized.html)
      setCss(serialized.css)
    },
    [page],
  )

  const applyPage = useCallback(
    (next: PageSettings) => {
      setPage(next)
      const serialized = serializeBlocksToDocument(blocks, next)
      setHtml(serialized.html)
      setCss(serialized.css)
    },
    [blocks],
  )

  const currentPayload = useMemo(
    () =>
      JSON.stringify({
        blocksJson: JSON.stringify(blocks),
        html,
        css,
        schemaJson,
        sampleDataJson,
        assetsJson: serializeAssetsJson(assets),
      }),
    [blocks, html, css, schemaJson, sampleDataJson, assets],
  )

  const dirty = Boolean(baseline) && currentPayload !== baseline
  const blocker = useBlocker(dirty)
  const missingDian = useMemo(() => missingRequiredLabels(blocks), [blocks])
  const canPersist = missingDian.length === 0

  const debouncedHtml = useDebouncedValue(html)
  const debouncedCss = useDebouncedValue(css)
  const debouncedSample = useDebouncedValue(sampleDataJson)

  const handleSave = useCallback(async () => {
    if (missingRequiredLabels(blocks).length > 0) {
      toast.push(
        'Completa las etiquetas DIAN obligatorias antes de guardar',
        'error',
      )
      return
    }
    try {
      setStatusText('Guardando…')
      const assetsJson = serializeAssetsJson(assets)
      const baselinePayload = JSON.stringify({
        blocksJson: JSON.stringify(blocks),
        html,
        css,
        schemaJson,
        sampleDataJson,
        assetsJson,
      })
      // Keep editor state; cache updates must not wipe assets mid-save.
      skipHydrateRef.current = true
      const version = await saveDraft.mutateAsync({
        html,
        css,
        schemaJson,
        sampleDataJson,
        blocksJson: JSON.stringify(blocks),
        assetsJson,
      })
      setBaseline(baselinePayload)
      hydratedKeyRef.current = `${id}:${version.id}:${version.versionNumber}:draft`
      setStatusText(`Guardado · v${version.versionNumber}`)
      toast.push('Diseño guardado', 'success')
    } catch {
      skipHydrateRef.current = false
      setStatusText('Error al guardar')
      toast.push('No pudimos guardar el diseño', 'error')
    }
  }, [
    assets,
    blocks,
    css,
    html,
    id,
    sampleDataJson,
    saveDraft,
    schemaJson,
    toast,
  ])

  const handlePublish = useCallback(async () => {
    if (missingRequiredLabels(blocks).length > 0) {
      toast.push(
        'Completa las etiquetas DIAN obligatorias antes de publicar',
        'error',
      )
      return
    }
    try {
      await handleSave()
      setStatusText('Publicando…')
      skipHydrateRef.current = true
      const version = await publish.mutateAsync()
      hydratedKeyRef.current = `${id}:${version.id}:${version.versionNumber}:published`
      setStatusText(`Publicada · v${version.versionNumber}`)
      toast.push(`Versión ${version.versionNumber} publicada`, 'success')
    } catch {
      skipHydrateRef.current = false
      setStatusText('Error al publicar')
      toast.push('No pudimos publicar la plantilla', 'error')
    }
  }, [blocks, handleSave, id, publish, toast])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  if (isLoading) {
    return (
      <div className={styles.fullState}>
        <LoaderCircle className={styles.spin} size={20} />
        Cargando editor…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="No encontramos la plantilla"
        description="Puede que haya sido eliminada del almacenamiento local."
        actionLabel="Reintentar"
        onAction={() => void refetch()}
        icon={<AlertTriangle size={22} />}
      />
    )
  }

  return (
    <section className={`${styles.editor} pageEnter`}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Link className={styles.back} to="/" aria-label="Volver a plantillas" title="Volver a plantillas">
            <ArrowLeft size={16} />
          </Link>
          <div className={styles.titleBlock}>
            <div className={styles.titleRow}>
              <h1>{data.template.name}</h1>
              <Badge
                tone={
                  dirty
                    ? 'warning'
                    : data.template.status === 'published'
                      ? 'success'
                      : 'neutral'
                }
              >
                {dirty
                  ? 'Sin guardar'
                  : data.template.status === 'published'
                    ? 'Publicada'
                    : 'Borrador'}
              </Badge>
            </div>
            <p className={styles.meta}>{statusText}</p>
          </div>
        </div>

        <div className={styles.modeSwitch} role="tablist" aria-label="Modo de edición">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'visual'}
            className={mode === 'visual' ? styles.modeActive : styles.modeBtn}
            onClick={() => setMode('visual')}
          >
            <LayoutTemplate size={14} />
            Diseño
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'advanced'}
            className={mode === 'advanced' ? styles.modeActive : styles.modeBtn}
            onClick={() => setMode('advanced')}
          >
            <Code2 size={14} />
            Avanzado
          </button>
        </div>

        <div className={styles.toolbarActions}>
          <Button
            type="button"
            variant="ghost"
            icon={<Save size={16} />}
            hint="⌘/Ctrl+S"
            disabled={saveDraft.isPending || !canPersist}
            title={
              canPersist
                ? undefined
                : `Faltan ${missingDian.length} etiquetas DIAN obligatorias`
            }
            onClick={() => void handleSave()}
          >
            Guardar
          </Button>
          <Button
            type="button"
            icon={<UploadCloud size={16} />}
            disabled={publish.isPending || !canPersist}
            title={
              canPersist
                ? undefined
                : `Faltan ${missingDian.length} etiquetas DIAN obligatorias`
            }
            onClick={() => void handlePublish()}
          >
            Publicar
          </Button>
        </div>
      </header>

      <div className={styles.workspace}>
        <div className={styles.codePane}>
          {mode === 'visual' ? (
            <VisualBuilder
              blocks={blocks}
              sampleDataJson={sampleDataJson}
              page={page}
              templateId={id}
              assets={assets}
              onAssetsChange={setAssets}
              onChange={applyBlocks}
              onPageChange={applyPage}
            />
          ) : (
            <>
              <div className={styles.tabs} role="tablist" aria-label="Paneles avanzados">
                {(
                  [
                    ['sample', 'Datos'],
                    ['html', 'HTML'],
                    ['css', 'CSS'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={advancedTab === key}
                    className={
                      advancedTab === key ? styles.tabActive : styles.tab
                    }
                    onClick={() => setAdvancedTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.editorBody}>
                {advancedTab === 'sample' ? (
                  <CodeEditor
                    label="Datos de ejemplo (es-CO)"
                    language="json"
                    value={sampleDataJson}
                    onChange={setSampleDataJson}
                  />
                ) : null}
                {advancedTab === 'html' ? (
                  <CodeEditor
                    label="HTML generado (solo lectura recomendada)"
                    language="html"
                    value={html}
                    onChange={setHtml}
                  />
                ) : null}
                {advancedTab === 'css' ? (
                  <CodeEditor
                    label="CSS generado"
                    language="css"
                    value={css}
                    onChange={setCss}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className={styles.previewPane}>
          <PreviewHtml
            html={debouncedHtml}
            css={debouncedCss}
            sampleDataJson={debouncedSample}
            templateName={data.template.name}
            assets={Object.fromEntries(
              assets.map((asset) => [asset.id, asset.dataUrl]),
            )}
          />
        </div>
      </div>

      {blocker.state === 'blocked' ? (
        <div className={styles.backdrop}>
          <div className={styles.confirm} role="dialog" aria-modal="true">
            <h2>¿Salir sin guardar?</h2>
            <p>Tienes cambios sin guardar. Si sales ahora, se perderán.</p>
            <div className={styles.confirmActions}>
              <Button type="button" variant="ghost" onClick={() => blocker.reset?.()}>
                Seguir editando
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => blocker.proceed?.()}
              >
                Descartar cambios
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

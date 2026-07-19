import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  UploadCloud,
  AlertTriangle,
  Code2,
  LayoutTemplate,
  History,
  RotateCcw,
  Download,
} from 'lucide-react'
import { buildEditorSnapshot } from '@/features/editor/buildEditorSnapshot'
import { CodeEditor } from '@/features/editor/CodeEditor'
import { PreviewHtml } from '@/features/editor/PreviewHtml'
import { getLatestVersion, describeTemplateStatus } from '@/features/templates/api'
import {
  buildTemplateExport,
  downloadTemplateExport,
} from '@/features/templates/exportImport'
import {
  useDeleteDraft,
  usePublishTemplate,
  useRollbackVersion,
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
import { useAuth } from '@/features/auth/AuthProvider'
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
  const { session } = useAuth()
  const companyNit = session?.nit ?? ''
  const { data, isLoading, isError, refetch } = useTemplateBundle(id, companyNit)
  const saveDraft = useSaveDraft(id, companyNit)
  const publish = usePublishTemplate(id, companyNit)
  const discardDraft = useDeleteDraft(id, companyNit)
  const rollback = useRollbackVersion(id, companyNit)

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
    const hydrateKey = `${data.template.id}:${version.id}:${version.versionNumber}:${data.template.hasDraft ? 'd' : 'p'}:${data.template.publishedVersionNumber ?? 0}`

    if (skipHydrateRef.current) {
      skipHydrateRef.current = false
      hydratedKeyRef.current = hydrateKey
      setStatusText(describeTemplateStatus(data.template))
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
      buildEditorSnapshot({
        blocks: nextBlocks,
        html: nextHtml,
        css: nextCss,
        schemaJson: version.schemaJson,
        sampleDataJson: version.sampleDataJson,
        assets: nextAssets,
      }),
    )
    setStatusText(describeTemplateStatus(data.template))
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

  const currentSnapshot = useMemo(
    () =>
      buildEditorSnapshot({
        blocks,
        html,
        css,
        schemaJson,
        sampleDataJson,
        assets,
      }),
    [blocks, html, css, schemaJson, sampleDataJson, assets],
  )

  const dirty = Boolean(baseline) && currentSnapshot !== baseline
  const blocker = useBlocker(dirty)
  const missingDian = useMemo(() => missingRequiredLabels(blocks), [blocks])
  const canPersist = dirty && missingDian.length === 0

  const debouncedHtml = useDebouncedValue(html)
  const debouncedCss = useDebouncedValue(css)
  const debouncedSample = useDebouncedValue(sampleDataJson)

  const handleSave = useCallback(async () => {
    if (!dirty) return
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
      const nextBaseline = buildEditorSnapshot({
        blocks,
        html,
        css,
        schemaJson,
        sampleDataJson,
        assets,
      })
      // Keep editor state; cache updates must not wipe assets mid-save.
      skipHydrateRef.current = true
      const version = await saveDraft.mutateAsync({
        status: 'draft',
        html,
        css,
        schemaJson,
        sampleDataJson,
        blocksJson: JSON.stringify(blocks),
        assetsJson,
      })
      setBaseline(nextBaseline)
      hydratedKeyRef.current = `${id}:${version.id}:${version.versionNumber}:draft`
      setStatusText(
        data
          ? describeTemplateStatus({
              ...data.template,
              hasDraft: true,
              currentVersionNumber: version.versionNumber,
            })
          : `Guardado · borrador v${version.versionNumber}`,
      )
      toast.push('Borrador guardado (la publicada no cambia)', 'success')
    } catch {
      skipHydrateRef.current = false
      setStatusText('Error al guardar')
      toast.push('No pudimos guardar el diseño', 'error')
    }
  }, [
    assets,
    blocks,
    css,
    data,
    dirty,
    html,
    id,
    sampleDataJson,
    saveDraft,
    schemaJson,
    toast,
  ])

  const handlePublish = useCallback(async () => {
    if (!dirty) return
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
  }, [blocks, dirty, handleSave, id, publish, toast])

  const handleDiscardDraft = useCallback(async () => {
    if (!data?.template.hasDraft) return
    try {
      skipHydrateRef.current = false
      hydratedKeyRef.current = ''
      await discardDraft.mutateAsync()
      toast.push('Borrador descartado', 'success')
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No se pudo descartar el borrador',
        'error',
      )
    }
  }, [data?.template.hasDraft, discardDraft, toast])

  const handleRollback = useCallback(
    async (versionNumber: number) => {
      if (dirty) {
        toast.push('Guarda o descarta tus cambios locales antes de volver a una versión.', 'error')
        return
      }
      const ok = window.confirm(
        `¿Volver a la versión ${versionNumber} como publicada?\n` +
          'Las facturas nuevas usarán esa versión. Si hay un borrador abierto, se descartará.',
      )
      if (!ok) return
      try {
        skipHydrateRef.current = false
        hydratedKeyRef.current = ''
        const version = await rollback.mutateAsync(versionNumber)
        setStatusText(`Publicada · v${version.versionNumber}`)
        toast.push(`Versión ${version.versionNumber} vuelve a ser la publicada`, 'success')
      } catch (error) {
        toast.push(
          error instanceof Error ? error.message : 'No se pudo volver a esa versión',
          'error',
        )
      }
    },
    [dirty, rollback, toast],
  )

  const handleExport = useCallback(() => {
    if (!data) return
    const tip = getLatestVersion(data)
    const payload = buildTemplateExport({
      name: data.template.name,
      documentType: data.template.documentType,
      version: {
        html,
        css,
        schemaJson,
        sampleDataJson,
        blocksJson: JSON.stringify(blocks),
        assetsJson: tip.assetsJson,
      },
      page,
      assets,
    })
    downloadTemplateExport(payload)
    toast.push('Plantilla exportada', 'success')
  }, [assets, blocks, css, data, html, page, sampleDataJson, schemaJson, toast])

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
    return null
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
                    : data.template.hasDraft
                      ? 'warning'
                      : data.template.status === 'published'
                        ? 'success'
                        : 'neutral'
                }
              >
                {dirty
                  ? 'Sin guardar'
                  : data.template.hasDraft
                    ? 'Borrador'
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
          {data.template.hasDraft && (data.template.publishedVersionNumber ?? 0) > 0 ? (
            <Button
              type="button"
              variant="ghost"
              disabled={discardDraft.isPending}
              title="Vuelve a la versión publicada y elimina el borrador"
              onClick={() => void handleDiscardDraft()}
            >
              Descartar borrador
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            icon={<Download size={16} />}
            title="Descargar JSON de la tip actual (incluye cambios sin guardar)"
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Button
            type="button"
            variant="ghost"
            icon={<Save size={16} />}
            hint="⌘/Ctrl+S"
            disabled={saveDraft.isPending || !canPersist}
            title={
              !dirty
                ? 'No hay cambios por guardar'
                : missingDian.length > 0
                  ? `Faltan ${missingDian.length} etiquetas DIAN obligatorias`
                  : undefined
            }
            onClick={() => void handleSave()}
          >
            Guardar
          </Button>
          <Button
            type="button"
            icon={<UploadCloud size={16} />}
            disabled={publish.isPending || saveDraft.isPending || !canPersist}
            title={
              !dirty
                ? 'No hay cambios por publicar'
                : missingDian.length > 0
                  ? `Faltan ${missingDian.length} etiquetas DIAN obligatorias`
                  : undefined
            }
            onClick={() => void handlePublish()}
          >
            Publicar
          </Button>
        </div>
      </header>

      {data.versions.length > 1 ? (
        <div className={styles.versionBar} aria-label="Historial de versiones">
          <span className={styles.versionBarLabel}>
            <History size={13} />
            Versiones
          </span>
          <ul className={styles.versionList}>
            {[...data.versions]
              .sort((a, b) => b.versionNumber - a.versionNumber)
              .map((version) => {
                const status = version.status ?? (version.isPublished ? 'published' : 'draft')
                const label =
                  status === 'published'
                    ? 'Publicada'
                    : status === 'used'
                      ? 'Usada'
                      : 'Borrador'
                return (
                  <li key={version.id} className={styles.versionItem}>
                    <span className={styles.versionNum}>v{version.versionNumber}</span>
                    <span className={styles.versionStatus} data-status={status}>
                      {label}
                    </span>
                    {status === 'used' ? (
                      <button
                        type="button"
                        className={styles.versionRollback}
                        disabled={rollback.isPending || dirty}
                        title="Volver a publicar esta versión (sin crear un número nuevo)"
                        onClick={() => void handleRollback(version.versionNumber)}
                      >
                        <RotateCcw size={12} />
                        Volver aquí
                      </button>
                    ) : null}
                  </li>
                )
              })}
          </ul>
        </div>
      ) : null}

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

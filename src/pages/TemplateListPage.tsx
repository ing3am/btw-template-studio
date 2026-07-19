import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Archive,
  Download,
  FilePlus2,
  Files,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  canHardDeleteTemplate,
  describeTemplateStatus,
  getLatestVersion,
  getTemplateBundle,
} from '@/features/templates/api'
import {
  buildTemplateExport,
  downloadTemplateExport,
  readTemplateExportFile,
} from '@/features/templates/exportImport'
import {
  useArchiveTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useImportTemplate,
  useTemplates,
} from '@/features/templates/hooks'
import type { DocumentType, TemplateExportV1 } from '@/features/templates/types'
import {
  CreateTemplateDialog,
  type CreateTemplateFormValue,
} from '@/features/templates/components/CreateTemplateDialog'
import { ImportTemplateDialog } from '@/features/templates/components/ImportTemplateDialog'
import styles from './TemplateListPage.module.css'

const typeLabel: Record<DocumentType, string> = {
  factura: 'Factura',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  otro: 'Otro',
}

const DOCUMENT_TYPES = Object.keys(typeLabel) as DocumentType[]

type TypeFilter = 'all' | DocumentType

type PendingDestructive = {
  kind: 'archive' | 'delete'
  id: string
  name: string
}

export function TemplateListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session } = useAuth()
  const companyNit = session?.nit ?? ''
  const { data, isLoading, isError, refetch } = useTemplates(companyNit)
  const createMutation = useCreateTemplate(companyNit)
  const importMutation = useImportTemplate(companyNit)
  const archiveMutation = useArchiveTemplate(companyNit)
  const deleteMutation = useDeleteTemplate(companyNit)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [importPayload, setImportPayload] = useState<TemplateExportV1 | null>(null)
  const [importName, setImportName] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDestructive, setPendingDestructive] = useState<PendingDestructive | null>(
    null,
  )

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.filter((template) => {
      if (typeFilter !== 'all' && template.documentType !== typeFilter) return false
      if (!q) return true
      const haystack = [
        template.name,
        typeLabel[template.documentType],
        template.nit ?? '',
        describeTemplateStatus(template),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [data, query, typeFilter])

  const hasFilters = query.trim().length > 0 || typeFilter !== 'all'

  async function handleCreate(value: CreateTemplateFormValue) {
    try {
      const template = await createMutation.mutateAsync({
        name: value.name,
        documentType: value.documentType,
        nit: value.nit,
        sectorSalud: value.sectorSalud,
      })
      toast.push('Plantilla creada', 'success')
      setOpen(false)
      navigate(`/templates/${template.id}/edit`)
    } catch {
      toast.push('No pudimos crear la plantilla', 'error')
    }
  }

  async function handleExport(templateId: string, templateName: string) {
    if (!companyNit) {
      toast.push('Inicia sesión para exportar plantillas.', 'error')
      return
    }
    try {
      setExportingId(templateId)
      const bundle = await getTemplateBundle(templateId, companyNit)
      const version = getLatestVersion(bundle)
      const payload = buildTemplateExport({
        name: bundle.template.name,
        documentType: bundle.template.documentType,
        version,
      })
      downloadTemplateExport(payload)
      toast.push(`Exportamos «${templateName}»`, 'success')
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No pudimos exportar la plantilla',
        'error',
      )
    } finally {
      setExportingId(null)
    }
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return
    if (!companyNit) {
      toast.push('Inicia sesión para importar plantillas.', 'error')
      return
    }
    const parsed = await readTemplateExportFile(file)
    if (importInputRef.current) importInputRef.current.value = ''
    if (!parsed.ok) {
      toast.push(parsed.error, 'error')
      return
    }
    setImportPayload(parsed.data)
    setImportName(parsed.data.template.name.trim() || 'Plantilla importada')
  }

  function closeImportDialog() {
    if (importMutation.isPending) return
    setImportPayload(null)
    setImportName('')
  }

  async function handleConfirmImport(name: string) {
    if (!importPayload) return
    try {
      const result = await importMutation.mutateAsync({
        payload: importPayload,
        name,
      })
      setImportPayload(null)
      setImportName('')
      toast.push(`Importamos «${result.template.name}» como borrador`, 'success')
      for (const warning of result.warnings) {
        toast.push(warning, 'info')
      }
      navigate(`/templates/${result.template.id}/edit`)
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No pudimos importar la plantilla',
        'error',
      )
    }
  }

  function clearFilters() {
    setQuery('')
    setTypeFilter('all')
  }

  function requestArchive(templateId: string, templateName: string) {
    if (!companyNit) {
      toast.push('Inicia sesión para archivar plantillas.', 'error')
      return
    }
    setPendingDestructive({ kind: 'archive', id: templateId, name: templateName })
  }

  function requestDelete(templateId: string, templateName: string) {
    if (!companyNit) {
      toast.push('Inicia sesión para eliminar plantillas.', 'error')
      return
    }
    setPendingDestructive({ kind: 'delete', id: templateId, name: templateName })
  }

  async function confirmDestructive() {
    if (!pendingDestructive || !companyNit) return
    const { kind, id, name } = pendingDestructive
    try {
      setBusyId(id)
      if (kind === 'archive') {
        await archiveMutation.mutateAsync(id)
        toast.push(`Archivamos «${name}»`, 'success')
      } else {
        await deleteMutation.mutateAsync(id)
        toast.push(`Eliminamos «${name}»`, 'success')
      }
      setPendingDestructive(null)
    } catch (error) {
      toast.push(
        error instanceof Error
          ? error.message
          : kind === 'archive'
            ? 'No pudimos archivar la plantilla'
            : 'No pudimos eliminar la plantilla',
        'error',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Catálogo</p>
          <h1 className={styles.title}>Plantillas</h1>
          <p className={styles.lead}>
            Crea y ajusta cómo se ven tus facturas. Arrastra lo que necesites y
            publícalo cuando esté listo.
          </p>
        </div>
        <div className={styles.headerActions}>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className={styles.srOnly}
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              void handleImportFile(file)
            }}
          />
          <Button
            type="button"
            variant="secondary"
            icon={<Upload size={16} />}
            disabled={!companyNit || importMutation.isPending}
            onClick={() => importInputRef.current?.click()}
          >
            Importar
          </Button>
          <Button
            type="button"
            icon={<FilePlus2 size={16} />}
            onClick={() => setOpen(true)}
          >
            Nueva plantilla
          </Button>
        </div>
      </header>

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={16} aria-hidden />
            <span className={styles.srOnly}>Buscar plantillas</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o NIT…"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>

          <label className={styles.filter}>
            <span className={styles.filterLabel}>Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            >
              <option value="all">Todos</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel[type]}
                </option>
              ))}
            </select>
          </label>

          {hasFilters ? (
            <p className={styles.resultCount} aria-live="polite">
              {filtered.length === 0
                ? 'Sin coincidencias'
                : `${filtered.length} de ${data.length}`}
            </p>
          ) : null}
        </div>
      ) : null}

      {!companyNit && !isLoading ? (
        <EmptyState
          title="Sin NIT de empresa"
          description="Inicia sesión de nuevo para cargar las plantillas de tu compañía."
          icon={<Files size={22} />}
        />
      ) : null}

      {isError ? (
        <EmptyState
          title="No pudimos cargar las plantillas"
          description="Revisa la conexión con la API o vuelve a intentar en un momento."
          actionLabel="Reintentar"
          onAction={() => void refetch()}
          icon={<Files size={22} />}
        />
      ) : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState
          title="Aún no hay plantillas"
          description="Crea la primera para empezar a diseñar facturas y otros documentos electrónicos."
          actionLabel="Crear plantilla"
          onAction={() => setOpen(true)}
          icon={<Files size={22} />}
        />
      ) : null}

      {!isLoading && !isError && data && data.length > 0 && filtered.length === 0 ? (
        <EmptyState
          title="Ninguna plantilla coincide"
          description="Prueba otro nombre, NIT o tipo documental."
          actionLabel="Limpiar filtros"
          onAction={clearFilters}
          icon={<Search size={22} />}
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((template, index) => (
            <article
              key={template.id}
              className={styles.card}
              style={{ ['--stagger' as string]: index }}
            >
              <Link
                to={`/templates/${template.id}/edit`}
                className={styles.cardLink}
                aria-label={`Abrir editor de ${template.name}`}
              >
                <div className={styles.cardTop}>
                  <h2 className={styles.cardName}>{template.name}</h2>
                  <Badge
                    tone={
                      template.hasDraft
                        ? 'warning'
                        : template.status === 'published'
                          ? 'success'
                          : template.status === 'used'
                            ? 'neutral'
                            : 'warning'
                    }
                  >
                    {template.hasDraft
                      ? 'Borrador'
                      : template.status === 'published'
                        ? 'Publicada'
                        : template.status === 'used'
                          ? 'Usada'
                          : 'Borrador'}
                  </Badge>
                </div>
                <p className={styles.cardMeta}>
                  {typeLabel[template.documentType]} · {describeTemplateStatus(template)}
                  {template.nit ? ` · NIT ${template.nit}` : ''}
                </p>
              </Link>
              <div className={styles.cardFoot}>
                <Link
                  to={`/templates/${template.id}/edit`}
                  className={styles.cardHint}
                >
                  Abrir editor
                  <ArrowUpRight size={16} aria-hidden />
                </Link>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.exportBtn}
                    disabled={exportingId === template.id || busyId === template.id}
                    aria-label={`Exportar ${template.name}`}
                    title="Descargar JSON de la plantilla"
                    onClick={() => void handleExport(template.id, template.name)}
                  >
                    <Download size={14} aria-hidden />
                    Exportar
                  </button>
                  {canHardDeleteTemplate(template) ? (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={busyId === template.id}
                      aria-label={`Eliminar ${template.name}`}
                      title="Eliminar plantilla sin uso"
                      onClick={() => requestDelete(template.id, template.name)}
                    >
                      <Trash2 size={14} aria-hidden />
                      Eliminar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.archiveBtn}
                      disabled={busyId === template.id}
                      aria-label={`Archivar ${template.name}`}
                      title="Archivar: oculta del catálogo sin romper facturas pineadas"
                      onClick={() => requestArchive(template.id, template.name)}
                    >
                      <Archive size={14} aria-hidden />
                      Archivar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <CreateTemplateDialog
        open={open}
        busy={createMutation.isPending}
        nit={session?.nit ?? ''}
        razonSocial={session?.razonSocial ?? ''}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />

      <ImportTemplateDialog
        open={Boolean(importPayload)}
        busy={importMutation.isPending}
        defaultName={importName}
        onClose={closeImportDialog}
        onImport={(name) => void handleConfirmImport(name)}
      />

      <ConfirmDialog
        open={Boolean(pendingDestructive)}
        title={
          pendingDestructive?.kind === 'delete'
            ? 'Eliminar plantilla'
            : 'Archivar plantilla'
        }
        description={
          pendingDestructive?.kind === 'delete'
            ? `¿Eliminar «${pendingDestructive.name}» de forma permanente? Solo es posible si nunca se publicó y no hay facturas vinculadas.`
            : pendingDestructive
              ? `¿Archivar «${pendingDestructive.name}»? Dejará de aparecer en el catálogo y no se usará en PDFs nuevos. Las facturas ya graficadas seguirán usando su versión pineada.`
              : ''
        }
        confirmLabel={pendingDestructive?.kind === 'delete' ? 'Eliminar' : 'Archivar'}
        cancelLabel="Cancelar"
        danger
        busy={Boolean(pendingDestructive && busyId === pendingDestructive.id)}
        onCancel={() => {
          if (!busyId) setPendingDestructive(null)
        }}
        onConfirm={() => void confirmDestructive()}
      />
    </section>
  )
}

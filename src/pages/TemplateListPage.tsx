import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, FilePlus2, Files, Search, X } from 'lucide-react'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import { describeTemplateStatus } from '@/features/templates/api'
import { useCreateTemplate, useTemplates } from '@/features/templates/hooks'
import type { DocumentType } from '@/features/templates/types'
import {
  CreateTemplateDialog,
  type CreateTemplateFormValue,
} from '@/features/templates/components/CreateTemplateDialog'
import styles from './TemplateListPage.module.css'

const typeLabel: Record<DocumentType, string> = {
  factura: 'Factura',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  otro: 'Otro',
}

const DOCUMENT_TYPES = Object.keys(typeLabel) as DocumentType[]

type TypeFilter = 'all' | DocumentType

export function TemplateListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session } = useAuth()
  const companyNit = session?.nit ?? ''
  const { data, isLoading, isError, refetch } = useTemplates(companyNit)
  const createMutation = useCreateTemplate(companyNit)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

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

  function clearFilters() {
    setQuery('')
    setTypeFilter('all')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Catálogo</p>
          <h1 className={styles.title}>Plantillas</h1>
          <p className={styles.lead}>
            Diseña facturas electrónicas con bloques visuales. El cliente no necesita saber HTML.
          </p>
        </div>
        <Button
          type="button"
          icon={<FilePlus2 size={16} />}
          onClick={() => setOpen(true)}
        >
          Nueva plantilla
        </Button>
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
            <Link
              key={template.id}
              to={`/templates/${template.id}/edit`}
              className={styles.card}
              style={{ ['--stagger' as string]: index }}
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
                        : 'warning'
                  }
                >
                  {template.hasDraft
                    ? 'Borrador'
                    : template.status === 'published'
                      ? 'Publicada'
                      : 'Borrador'}
                </Badge>
              </div>
              <p className={styles.cardMeta}>
                {typeLabel[template.documentType]} · {describeTemplateStatus(template)}
                {template.nit ? ` · NIT ${template.nit}` : ''}
              </p>
              <div className={styles.cardFoot}>
                <span className={styles.cardHint}>Abrir editor</span>
                <ArrowUpRight size={18} aria-hidden />
              </div>
            </Link>
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
    </section>
  )
}

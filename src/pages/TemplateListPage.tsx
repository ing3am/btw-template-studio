import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FilePlus2, Files, LoaderCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import { describeTemplateStatus } from '@/features/templates/api'
import { useCreateTemplate, useTemplates } from '@/features/templates/hooks'
import type { DocumentType } from '@/features/templates/types'
import { CreateTemplateDialog } from '@/features/templates/components/CreateTemplateDialog'
import styles from '@/pages/Page.module.css'

const typeLabel: Record<DocumentType, string> = {
  factura: 'Factura',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  otro: 'Otro',
}

export function TemplateListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useTemplates()
  const createMutation = useCreateTemplate()
  const [open, setOpen] = useState(false)

  async function handleCreate(name: string, documentType: DocumentType) {
    try {
      const template = await createMutation.mutateAsync({ name, documentType })
      toast.push('Plantilla creada', 'success')
      setOpen(false)
      navigate(`/templates/${template.id}/edit`)
    } catch {
      toast.push('No pudimos crear la plantilla', 'error')
    }
  }

  return (
    <section className={`${styles.page} pageEnter`}>
      <header className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Catálogo</p>
          <h1>Plantillas</h1>
          <p className={styles.lead}>
            Diseña la factura con bloques visuales. El cliente no necesita saber HTML.
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

      {isLoading ? (
        <div className={styles.panelMuted}>
          <LoaderCircle className={styles.spin} size={18} />
          Cargando plantillas…
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          title="No pudimos cargar las plantillas"
          description="Revisa el almacenamiento local o vuelve a intentar en un momento."
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

      {!isLoading && !isError && data && data.length > 0 ? (
        <div className={styles.list}>
          {data.map((template) => (
            <article key={template.id} className={styles.item}>
              <div>
                <div className={styles.itemTitleRow}>
                  <h2>{template.name}</h2>
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
                <p>
                  {typeLabel[template.documentType]} · {describeTemplateStatus(template)}
                </p>
              </div>
              <Link className={styles.action} to={`/templates/${template.id}/edit`}>
                Abrir editor
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      <CreateTemplateDialog
        open={open}
        busy={createMutation.isPending}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </section>
  )
}

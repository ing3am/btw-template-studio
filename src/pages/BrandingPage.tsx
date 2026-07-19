import { useCallback, useEffect, useState } from 'react'
import {
  ImagePlus,
  Images,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useAuth, useCompanyNit } from '@/features/auth/AuthProvider'
import {
  BRAND_ASSET_MAX_COUNT,
  brandAssetAbsoluteUrl,
  deleteBrandAsset,
  listBrandAssets,
  uploadBrandAsset,
  type BrandAsset,
} from '@/features/templates/brandAssetsApi'
import { UploadBrandAssetDialog } from '@/features/templates/components/UploadBrandAssetDialog'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import styles from './BrandingPage.module.css'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BrandingPage() {
  const toast = useToast()
  const { session } = useAuth()
  const nit = useCompanyNit()
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BrandAsset | null>(null)
  const [deleting, setDeleting] = useState(false)

  const atLimit = assets.length >= BRAND_ASSET_MAX_COUNT
  const slotsLeft = Math.max(0, BRAND_ASSET_MAX_COUNT - assets.length)
  const fillPct = Math.min(100, (assets.length / BRAND_ASSET_MAX_COUNT) * 100)

  const reload = useCallback(async () => {
    if (!nit) {
      setAssets([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const items = await listBrandAssets(nit)
      setAssets(items)
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No se pudieron cargar las imágenes',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }, [nit, toast])

  useEffect(() => {
    void reload()
  }, [reload])

  async function handleUpload(file: File) {
    if (!nit) {
      toast.push('No hay NIT en la sesión. Vuelve a iniciar sesión.', 'error')
      return
    }
    if (assets.length >= BRAND_ASSET_MAX_COUNT) {
      toast.push(
        `Máximo ${BRAND_ASSET_MAX_COUNT} imágenes. Elimina una para subir otra.`,
        'error',
      )
      return
    }
    setUploading(true)
    try {
      await uploadBrandAsset(file, nit)
      toast.push('Imagen agregada a la biblioteca', 'success')
      setUploadOpen(false)
      await reload()
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No se pudo subir la imagen',
        'error',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteBrandAsset(pendingDelete.id)
      toast.push('Imagen eliminada', 'success')
      setPendingDelete(null)
      await reload()
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No se pudo eliminar',
        'error',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Biblioteca</p>
          <h1 className={styles.title}>Branding</h1>
          <p className={styles.lead}>
            Logos e imágenes de tu empresa para usar en el editor. Máximo{' '}
            {BRAND_ASSET_MAX_COUNT} archivos · 1.5 MB cada uno.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            type="button"
            variant="ghost"
            icon={<RefreshCw size={16} />}
            onClick={() => void reload()}
            disabled={loading || !nit}
          >
            Actualizar
          </Button>
          <Button
            type="button"
            icon={<ImagePlus size={16} />}
            onClick={() => setUploadOpen(true)}
            disabled={atLimit || !nit || uploading}
            title={
              atLimit
                ? `Límite de ${BRAND_ASSET_MAX_COUNT} alcanzado`
                : undefined
            }
          >
            {atLimit ? 'Límite alcanzado' : 'Subir imagen'}
          </Button>
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

        <div className={styles.capacity} aria-live="polite">
          <div className={styles.capacityTop}>
            <span>Espacio en biblioteca</span>
            <strong>
              {assets.length}/{BRAND_ASSET_MAX_COUNT}
            </strong>
          </div>
          <div className={styles.meter} role="progressbar" aria-valuenow={assets.length} aria-valuemin={0} aria-valuemax={BRAND_ASSET_MAX_COUNT}>
            <span style={{ width: `${fillPct}%` }} />
          </div>
          <p className={styles.capacityHint}>
            {atLimit
              ? 'Biblioteca llena. Elimina una imagen para subir otra.'
              : `${slotsLeft} espacio${slotsLeft === 1 ? '' : 's'} disponible${slotsLeft === 1 ? '' : 's'}.`}
          </p>
        </div>
      </div>

      {!nit ? (
        <EmptyState
          title="Sin NIT de empresa"
          description="Inicia sesión de nuevo para gestionar las imágenes de tu compañía."
          icon={<Images size={22} />}
        />
      ) : null}

      {nit && loading ? (
        <div className={styles.loading}>
          <LoaderCircle className={styles.spin} size={18} />
          Cargando biblioteca…
        </div>
      ) : null}

      {nit && !loading && assets.length === 0 ? (
        <EmptyState
          title="Aún no hay imágenes"
          description="Sube un logo o recurso visual para seleccionarlo luego en el editor de plantillas."
          actionLabel="Subir imagen"
          onAction={() => setUploadOpen(true)}
          icon={<Images size={22} />}
        />
      ) : null}

      {nit && !loading && assets.length > 0 ? (
        <div className={styles.grid}>
          {assets.map((asset, index) => (
            <article
              key={asset.id}
              className={styles.card}
              style={{ ['--stagger' as string]: index }}
            >
              <div className={styles.thumbWrap}>
                <img
                  src={brandAssetAbsoluteUrl(asset.contentUrl)}
                  alt={asset.name}
                  className={styles.thumb}
                />
              </div>
              <div className={styles.meta}>
                <strong title={asset.name}>{asset.name}</strong>
                <span>
                  {formatBytes(asset.sizeBytes)} · {asset.mime.replace('image/', '')}
                </span>
              </div>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => setPendingDelete(asset)}
                aria-label={`Eliminar ${asset.name}`}
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <UploadBrandAssetDialog
        open={uploadOpen}
        busy={uploading}
        onClose={() => {
          if (!uploading) setUploadOpen(false)
        }}
        onUpload={(file) => void handleUpload(file)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar imagen"
        description={
          pendingDelete
            ? `¿Eliminar “${pendingDelete.name}” de la biblioteca? Las plantillas que la usen dejarán de mostrarla.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
        onConfirm={() => void handleDelete()}
      />
    </section>
  )
}

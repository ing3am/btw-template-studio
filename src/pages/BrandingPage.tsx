import { useCallback, useEffect, useState } from 'react'
import { ImagePlus, Trash2, LoaderCircle } from 'lucide-react'
import {
  BRAND_ASSET_MAX_COUNT,
  brandAssetAbsoluteUrl,
  deleteBrandAsset,
  listBrandAssets,
  uploadBrandAsset,
  type BrandAsset,
} from '@/features/templates/brandAssetsApi'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import styles from './Page.module.css'
import brandingStyles from './BrandingPage.module.css'

const DEFAULT_NIT = '900000000'

export function BrandingPage() {
  const toast = useToast()
  const [nit, setNit] = useState(DEFAULT_NIT)
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const atLimit = assets.length >= BRAND_ASSET_MAX_COUNT

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const items = await listBrandAssets(nit.trim() || DEFAULT_NIT)
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

  async function onUpload(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    if (assets.length >= BRAND_ASSET_MAX_COUNT) {
      toast.push(
        `Máximo ${BRAND_ASSET_MAX_COUNT} imágenes. Elimina una para subir otra.`,
        'error',
      )
      return
    }
    setUploading(true)
    try {
      await uploadBrandAsset(file, nit.trim() || DEFAULT_NIT)
      toast.push('Imagen agregada a la biblioteca', 'success')
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

  async function onDelete(id: string) {
    try {
      await deleteBrandAsset(id)
      toast.push('Imagen eliminada', 'success')
      await reload()
    } catch (error) {
      toast.push(
        error instanceof Error ? error.message : 'No se pudo eliminar',
        'error',
      )
    }
  }

  return (
    <section className={`${styles.page} pageEnter`}>
      <header className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Biblioteca</p>
          <h1>Branding</h1>
          <p className={styles.lead}>
            Sube logos e imágenes aquí (máx. {BRAND_ASSET_MAX_COUNT} · 1.5 MB c/u).
            En el editor solo las seleccionas. Puedes eliminar cualquiera cuando
            quieras.
          </p>
        </div>
        <label
          className={brandingStyles.uploadBtn}
          title={
            atLimit
              ? `Límite de ${BRAND_ASSET_MAX_COUNT} alcanzado. Elimina una para subir otra.`
              : undefined
          }
        >
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading || atLimit}
            onChange={(event) => {
              void onUpload(event.target.files)
              event.target.value = ''
            }}
          />
          {uploading ? <LoaderCircle className={brandingStyles.spin} size={16} /> : <ImagePlus size={16} />}
          {uploading ? 'Subiendo…' : atLimit ? 'Límite alcanzado' : 'Subir imagen'}
        </label>
      </header>

      <div className={brandingStyles.toolbar}>
        <label className={brandingStyles.nitField}>
          <span>NIT empresa</span>
          <input
            value={nit}
            onChange={(event) => setNit(event.target.value)}
            onBlur={() => void reload()}
            placeholder={DEFAULT_NIT}
          />
        </label>
        <span className={brandingStyles.count}>
          {assets.length}/{BRAND_ASSET_MAX_COUNT}
        </span>
        <Button type="button" variant="ghost" onClick={() => void reload()}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className={styles.panelMuted}>Cargando biblioteca…</div>
      ) : assets.length === 0 ? (
        <div className={styles.panelMuted}>
          Aún no hay imágenes. Sube un logo (máx. 1.5 MB) para usarlo en las
          plantillas.
        </div>
      ) : (
        <div className={brandingStyles.grid}>
          {assets.map((asset) => (
            <article key={asset.id} className={brandingStyles.card}>
              <img
                src={brandAssetAbsoluteUrl(asset.contentUrl)}
                alt={asset.name}
                className={brandingStyles.thumb}
              />
              <div className={brandingStyles.meta}>
                <strong title={asset.name}>{asset.name}</strong>
                <span>
                  {(asset.sizeBytes / 1024).toFixed(0)} KB · {asset.mime}
                </span>
              </div>
              <button
                type="button"
                className={brandingStyles.deleteBtn}
                onClick={() => void onDelete(asset.id)}
                aria-label={`Eliminar ${asset.name}`}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

import { useEffect, useState } from 'react'
import {
  brandAssetAbsoluteUrl,
  listBrandAssets,
  type BrandAsset,
} from '@/features/templates/brandAssetsApi'
import type { TemplateAsset } from '@/features/templates/templateAssets'
import type { TemplateBlock } from './types'
import { extractJsonPaths } from './extractJsonPaths'
import styles from './VisualBuilder.module.css'

type Props = {
  selected: TemplateBlock
  insideContainer: boolean
  sampleDataJson: string
  templateId: string
  assets: TemplateAsset[]
  onAssetsChange: (assets: TemplateAsset[]) => void
  onChangeProps: (props: TemplateBlock['props']) => void
  cellAlignRow: React.ReactNode
}

export function ImagenPropsPanel({
  selected,
  sampleDataJson,
  templateId,
  assets,
  onAssetsChange,
  onChangeProps,
  cellAlignRow,
}: Props) {
  const sourceMode =
    String(selected.props.sourceMode || 'upload') === 'campo' ? 'campo' : 'upload'
  const assetId = String(selected.props.assetId || '')
  const currentAsset = assets.find((item) => item.id === assetId)
  const paths = extractJsonPaths(sampleDataJson)
  const [library, setLibrary] = useState<BrandAsset[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLibraryLoading(true)
    void listBrandAssets()
      .then((items) => {
        if (!cancelled) setLibrary(items)
      })
      .catch(() => {
        if (!cancelled) setLibrary([])
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function selectFromLibrary(brandId: string) {
    const brand = library.find((item) => item.id === brandId)
    if (!brand) return
    const nextAsset: TemplateAsset = {
      id: brand.id,
      templateId,
      name: brand.name,
      mime: brand.mime,
      dataUrl: brandAssetAbsoluteUrl(brand.contentUrl),
      createdAt: brand.createdAt,
    }
    const others = assets.filter((item) => item.id !== brand.id)
    onAssetsChange([nextAsset, ...others])
    onChangeProps({
      ...selected.props,
      sourceMode: 'upload',
      assetId: brand.id,
    })
  }

  return (
    <div className={styles.props}>
      <h3>Imagen</h3>
      {cellAlignRow}
      <label className={styles.field}>
        <span>Origen</span>
        <select
          value={sourceMode}
          onChange={(event) =>
            onChangeProps({
              ...selected.props,
              sourceMode: event.target.value,
            })
          }
        >
          <option value="upload">Biblioteca Branding</option>
          <option value="campo">Campo del JSON</option>
        </select>
      </label>
      {sourceMode === 'upload' ? (
        <>
          <label className={styles.field}>
            <span>Imagen de la biblioteca</span>
            <select
              value={assetId}
              disabled={libraryLoading}
              onChange={(event) => selectFromLibrary(event.target.value)}
            >
              <option value="">
                {libraryLoading ? 'Cargando…' : 'Selecciona una imagen'}
              </option>
              {library.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {library.length === 0 && !libraryLoading ? (
            <p className={styles.hint}>
              No hay imágenes. Sube logos en la pestaña Branding y vuelve aquí.
            </p>
          ) : null}
          {currentAsset ? (
            <div className={styles.assetPreview}>
              <img src={currentAsset.dataUrl} alt={currentAsset.name} />
              <div className={styles.assetMeta}>
                <strong>{currentAsset.name}</strong>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    onAssetsChange(assets.filter((item) => item.id !== currentAsset.id))
                    onChangeProps({ ...selected.props, assetId: '' })
                  }}
                >
                  Quitar imagen
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <label className={styles.field}>
          <span>Campo JSON (URL de imagen)</span>
          <select
            value={String(selected.props.srcPath || '')}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                srcPath: event.target.value,
              })
            }
          >
            <option value="">Selecciona un campo</option>
            {paths.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={styles.layoutRow}>
        <label className={styles.field}>
          <span>Ancho (px)</span>
          <input
            type="number"
            min={24}
            value={Number(selected.props.width) || 120}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                width: Number(event.target.value) || 120,
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Alto (px)</span>
          <input
            type="number"
            min={24}
            value={Number(selected.props.height) || 120}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                height: Number(event.target.value) || 120,
              })
            }
          />
        </label>
      </div>
      <label className={styles.field}>
        <span>Alineación</span>
        <select
          value={String(selected.props.align || 'centro')}
          onChange={(event) =>
            onChangeProps({ ...selected.props, align: event.target.value })
          }
        >
          <option value="izquierda">Izquierda</option>
          <option value="centro">Centro</option>
          <option value="derecha">Derecha</option>
        </select>
      </label>
    </div>
  )
}

import { Download, ZoomIn, ZoomOut } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { buildMarginGuidesCss, parsePageSettingsFromCss } from '@/features/visual-builder/pageSettings'
import { downloadTemplateHtml } from './downloadTemplateHtml'
import { renderPreviewHtml } from './renderPreview'
import styles from './PreviewHtml.module.css'

type PreviewHtmlProps = {
  html: string
  css: string
  sampleDataJson: string
  templateName?: string
  assets?: Record<string, string>
}

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1
const ZOOM_DEFAULT = 1

function clampZoom(value: number): number {
  const stepped = Math.round(value / ZOOM_STEP) * ZOOM_STEP
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(stepped.toFixed(1))))
}

export function PreviewHtml({
  html,
  css,
  sampleDataJson,
  templateName,
  assets,
}: PreviewHtmlProps) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)

  const srcDoc = useMemo(() => {
    const page = parsePageSettingsFromCss(css)
    const guides = buildMarginGuidesCss(page)
    return renderPreviewHtml(html, css, sampleDataJson, {
      extraCss: guides,
      assets,
    })
  }, [html, css, sampleDataJson, assets])

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.label}>Preview HTML</div>
        <div className={styles.headerActions}>
          <div className={styles.zoomGroup} role="group" aria-label="Zoom del preview">
            <button
              type="button"
              className={styles.zoomBtn}
              aria-label="Alejar"
              title="Alejar"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((current) => clampZoom(current - ZOOM_STEP))}
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              className={styles.zoomLevel}
              aria-label="Restablecer zoom"
              title="Restablecer zoom"
              onClick={() => setZoom(ZOOM_DEFAULT)}
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              className={styles.zoomBtn}
              aria-label="Acercar"
              title="Acercar"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((current) => clampZoom(current + ZOOM_STEP))}
            >
              <ZoomIn size={14} />
            </button>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon={<Download size={14} />}
            onClick={() =>
              downloadTemplateHtml({
                html,
                css,
                sampleDataJson,
                name: templateName,
                assets,
              })
            }
          >
            Descargar HTML
          </Button>
        </div>
      </div>
      <div className={styles.viewport}>
        <div
          className={styles.zoomPad}
          style={{
            width: `${zoom * 100}%`,
            height: `${zoom * 100}%`,
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          <div
            className={styles.stage}
            style={{
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
            }}
          >
            <iframe
              title="Vista previa de la plantilla"
              className={styles.frame}
              srcDoc={srcDoc}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

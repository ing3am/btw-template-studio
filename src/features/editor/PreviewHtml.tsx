import { Download } from 'lucide-react'
import { useMemo } from 'react'
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
}

export function PreviewHtml({
  html,
  css,
  sampleDataJson,
  templateName,
}: PreviewHtmlProps) {
  const srcDoc = useMemo(() => {
    const page = parsePageSettingsFromCss(css)
    const guides = buildMarginGuidesCss(page)
    return renderPreviewHtml(html, css, sampleDataJson, {
      extraCss: guides,
    })
  }, [html, css, sampleDataJson])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.label}>Preview HTML</div>
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
            })
          }
        >
          Descargar HTML
        </Button>
      </div>
      <iframe title="Vista previa de la plantilla" className={styles.frame} srcDoc={srcDoc} />
    </div>
  )
}

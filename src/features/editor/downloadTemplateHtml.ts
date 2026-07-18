import { renderPreviewHtml } from './renderPreview'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function downloadTemplateHtml(options: {
  html: string
  css: string
  sampleDataJson: string
  name?: string
}): void {
  const content = renderPreviewHtml(
    options.html,
    options.css,
    options.sampleDataJson,
  )
  const slug = options.name ? slugify(options.name) : 'plantilla'
  const filename = `${slug || 'plantilla'}.html`

  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

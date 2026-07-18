type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function getPath(data: Json, path: string): Json {
  return path.split('.').reduce<Json>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc) && key in acc) {
      return acc[key]
    }
    return null
  }, data)
}

function formatValue(value: Json, filter?: string): string {
  if (value == null) return ''
  if (filter === 'moneda') {
    const amount = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(amount)) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(amount)
    }
  }
  if (filter === 'fecha') {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('es-CO').format(date)
    }
  }
  /** Payload URL (UBL/DIAN) → PNG del código QR para <img src>. */
  if (filter === 'qr') {
    const payload = String(value).trim()
    if (!payload) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(payload)}`
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat('es-CO').format(value)
  }
  return String(value)
}

function renderEach(template: string, data: Json): string {
  return template.replace(
    /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, path: string, inner: string) => {
      const list = getPath(data, path)
      if (!Array.isArray(list)) return ''
      return list
        .map((item) =>
          inner.replace(
            /\{\{(\w+)(?:\|(\w+))?\}\}/g,
            (_m, key: string, filter?: string) =>
              formatValue(getPath(item, key), filter),
          ),
        )
        .join('')
    },
  )
}

export function renderPreviewHtml(
  html: string,
  css: string,
  sampleDataJson: string,
  options?: { extraCss?: string },
): string {
  let data: Json = {}
  try {
    data = JSON.parse(sampleDataJson) as Json
  } catch {
    data = {}
  }

  let body = renderEach(html, data)
  body = body.replace(
    /\{\{([\w.]+)(?:\|(\w+))?\}\}/g,
    (_match, path: string, filter?: string) =>
      formatValue(getPath(data, path), filter),
  )

  const combinedCss = options?.extraCss
    ? `${css}\n${options.extraCss}`
    : css
  const styleTag = `<style>${combinedCss}</style>`
  if (body.includes('</head>')) {
    return body.replace('</head>', `${styleTag}</head>`)
  }
  return `${styleTag}${body}`
}

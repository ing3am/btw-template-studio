export type PageSizeId = 'a4' | 'carta' | 'oficio-co' | 'legal' | 'custom'
export type PageOrientation = 'vertical' | 'horizontal'

export type PageMarginsMm = {
  top: number
  right: number
  bottom: number
  left: number
}

export type PageSettings = {
  sizeId: PageSizeId
  widthMm: number
  heightMm: number
  orientation: PageOrientation
  margins: PageMarginsMm
  background: string
}

export const PAGE_SIZE_PRESETS: {
  id: Exclude<PageSizeId, 'custom'>
  label: string
  widthMm: number
  heightMm: number
}[] = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'carta', label: 'Carta', widthMm: 216, heightMm: 279 },
  { id: 'oficio-co', label: 'Oficio CO', widthMm: 216, heightMm: 330 },
  { id: 'legal', label: 'Legal', widthMm: 216, heightMm: 356 },
]

const PAGE_MARKER = '/* btw-page:'

export function defaultPageSettings(): PageSettings {
  return {
    sizeId: 'carta',
    widthMm: 216,
    heightMm: 279,
    orientation: 'vertical',
    margins: { top: 5, right: 5, bottom: 5, left: 5 },
    background: '#ffffff',
  }
}

export function resolvePageDimensions(
  sizeId: PageSizeId,
  orientation: PageOrientation,
  customWidthMm: number,
  customHeightMm: number,
): { widthMm: number; heightMm: number } {
  let widthMm = customWidthMm
  let heightMm = customHeightMm

  if (sizeId !== 'custom') {
    const preset = PAGE_SIZE_PRESETS.find((item) => item.id === sizeId)
    if (preset) {
      widthMm = preset.widthMm
      heightMm = preset.heightMm
    }
  }

  if (orientation === 'horizontal') {
    return { widthMm: heightMm, heightMm: widthMm }
  }
  return { widthMm, heightMm }
}

export function normalizePageSettings(
  partial?: Partial<PageSettings> | null,
): PageSettings {
  const base = defaultPageSettings()
  const sizeId = partial?.sizeId ?? base.sizeId
  const orientation = partial?.orientation ?? base.orientation
  const widthIn =
    typeof partial?.widthMm === 'number' && partial.widthMm > 0
      ? partial.widthMm
      : base.widthMm
  const heightIn =
    typeof partial?.heightMm === 'number' && partial.heightMm > 0
      ? partial.heightMm
      : base.heightMm

  const physical =
    sizeId === 'custom'
      ? { widthMm: Math.max(40, widthIn), heightMm: Math.max(40, heightIn) }
      : resolvePageDimensions(sizeId, orientation, widthIn, heightIn)

  const margin = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback

  return {
    sizeId,
    orientation,
    widthMm: physical.widthMm,
    heightMm: physical.heightMm,
    margins: {
      top: margin(partial?.margins?.top, base.margins.top),
      right: margin(partial?.margins?.right, base.margins.right),
      bottom: margin(partial?.margins?.bottom, base.margins.bottom),
      left: margin(partial?.margins?.left, base.margins.left),
    },
    background: partial?.background || base.background,
  }
}

export function applyPageSizeId(
  current: PageSettings,
  sizeId: PageSizeId,
): PageSettings {
  if (sizeId === 'custom') {
    return normalizePageSettings({ ...current, sizeId: 'custom' })
  }
  const dims = resolvePageDimensions(
    sizeId,
    current.orientation,
    current.widthMm,
    current.heightMm,
  )
  return normalizePageSettings({
    ...current,
    sizeId,
    widthMm: dims.widthMm,
    heightMm: dims.heightMm,
  })
}

export function applyPageOrientation(
  current: PageSettings,
  orientation: PageOrientation,
): PageSettings {
  if (current.orientation === orientation) return current

  if (current.sizeId === 'custom') {
    return normalizePageSettings({
      ...current,
      orientation,
      widthMm: current.heightMm,
      heightMm: current.widthMm,
    })
  }

  const dims = resolvePageDimensions(
    current.sizeId,
    orientation,
    current.widthMm,
    current.heightMm,
  )
  return normalizePageSettings({
    ...current,
    orientation,
    widthMm: dims.widthMm,
    heightMm: dims.heightMm,
  })
}

function buildMarker(page: PageSettings): string {
  return `${PAGE_MARKER}sizeId=${page.sizeId};orientation=${page.orientation};width=${page.widthMm};height=${page.heightMm};mt=${page.margins.top};mr=${page.margins.right};mb=${page.margins.bottom};ml=${page.margins.left};bg=${page.background} */`
}

export function buildPageCss(page: PageSettings): string {
  const p = normalizePageSettings(page)
  const { widthMm, heightMm, margins, background } = p
  return `${buildMarker(p)}
@page {
  size: ${widthMm}mm ${heightMm}mm;
  margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
}

html, body {
  margin: 0;
  padding: 0;
  background: ${background};
}

.page {
  width: ${widthMm}mm;
  min-height: ${heightMm}mm;
  box-sizing: border-box;
  padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
  background: ${background};
  margin: 0 auto;
  box-shadow: 0 0 0 1px #e4e2de;
}`
}

export function buildDocumentContentCss(): string {
  return `body {
  font-family: "DM Sans", "Segoe UI", sans-serif;
  font-size: 9px;
  color: #1c1412;
}

.container {
  margin: 0 0 18px;
  border-radius: 10px;
}

.container-title,
.datos-title {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.container-grid {
  display: grid;
  gap: 16px;
}

.container-grid.cols-1 { grid-template-columns: 1fr; }
.container-grid.cols-2 { grid-template-columns: 1fr 1fr; }
.container-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

.datos-row {
  display: grid;
  margin: 6px 0;
  align-items: baseline;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 18px;
}

th, td {
  border-bottom: 1px solid #e4e2de;
  padding: 10px 8px;
}

.note {
  margin: 12px 0;
  line-height: 1.45;
}`
}

export function buildFullDocumentCss(page: PageSettings): string {
  return `${buildPageCss(page)}

${buildDocumentContentCss()}`
}

/** Guías solo para preview del editor (no van al HTML descargado). */
export function buildMarginGuidesCss(page: PageSettings): string {
  const p = normalizePageSettings(page)
  const { margins } = p
  return `
.page {
  position: relative;
}
.page::before {
  content: "";
  pointer-events: none;
  position: absolute;
  top: ${margins.top}mm;
  right: ${margins.right}mm;
  bottom: ${margins.bottom}mm;
  left: ${margins.left}mm;
  border: 1px dashed rgba(199, 0, 57, 0.22);
  background: transparent;
  box-sizing: border-box;
}
body {
  background: #efeeec !important;
  padding: 16px !important;
}`
}

function parseMarker(css: string): Partial<PageSettings> | null {
  const start = css.indexOf(PAGE_MARKER)
  if (start < 0) return null
  const end = css.indexOf('*/', start)
  if (end < 0) return null
  const raw = css.slice(start + PAGE_MARKER.length, end).trim()
  const parts = Object.fromEntries(
    raw.split(';').map((pair) => {
      const [key, ...rest] = pair.split('=')
      return [key.trim(), rest.join('=').trim()]
    }),
  )

  const sizeId = parts.sizeId as PageSizeId | undefined
  const orientation = parts.orientation as PageOrientation | undefined
  return {
    sizeId:
      sizeId === 'a4' ||
      sizeId === 'carta' ||
      sizeId === 'oficio-co' ||
      sizeId === 'legal' ||
      sizeId === 'custom'
        ? sizeId
        : undefined,
    orientation:
      orientation === 'vertical' || orientation === 'horizontal'
        ? orientation
        : undefined,
    widthMm: Number(parts.width) || undefined,
    heightMm: Number(parts.height) || undefined,
    margins: {
      top: Number(parts.mt) || 0,
      right: Number(parts.mr) || 0,
      bottom: Number(parts.mb) || 0,
      left: Number(parts.ml) || 0,
    },
    background: parts.bg || undefined,
  }
}

function parseAtPageFallback(css: string): Partial<PageSettings> | null {
  const sizeMatch = css.match(/@page\s*\{[^}]*size:\s*([\d.]+)mm\s+([\d.]+)mm/i)
  const marginMatch = css.match(
    /@page\s*\{[^}]*margin:\s*([\d.]+)mm\s+([\d.]+)mm\s+([\d.]+)mm\s+([\d.]+)mm/i,
  )
  if (!sizeMatch) return null

  const widthMm = Number(sizeMatch[1])
  const heightMm = Number(sizeMatch[2])
  const preset = PAGE_SIZE_PRESETS.find(
    (item) =>
      (item.widthMm === widthMm && item.heightMm === heightMm) ||
      (item.widthMm === heightMm && item.heightMm === widthMm),
  )
  const orientation: PageOrientation =
    preset && widthMm === preset.heightMm && heightMm === preset.widthMm
      ? 'horizontal'
      : widthMm > heightMm
        ? 'horizontal'
        : 'vertical'

  return {
    sizeId: preset?.id ?? 'custom',
    orientation,
    widthMm,
    heightMm,
    margins: marginMatch
      ? {
          top: Number(marginMatch[1]),
          right: Number(marginMatch[2]),
          bottom: Number(marginMatch[3]),
          left: Number(marginMatch[4]),
        }
      : undefined,
  }
}

export function parsePageSettingsFromCss(css: string | undefined | null): PageSettings {
  if (!css?.trim()) return defaultPageSettings()
  const fromMarker = parseMarker(css)
  if (fromMarker) return normalizePageSettings(fromMarker)

  const fromAtPage = parseAtPageFallback(css)
  if (fromAtPage) {
    const bgMatch = css.match(/\.page\s*\{[^}]*background:\s*(#[0-9a-fA-F]{3,8})/i)
    return normalizePageSettings({
      ...fromAtPage,
      background: bgMatch?.[1],
    })
  }

  return defaultPageSettings()
}

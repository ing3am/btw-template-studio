export type PageSizeId = 'a4' | 'carta' | 'oficio-co' | 'legal' | 'custom'
export type PageOrientation = 'vertical' | 'horizontal'

export type PageMarginsMm = {
  top: number
  right: number
  bottom: number
  left: number
}

/** Free text + `{{json.path}}` tokens rendered in each margin band. */
export type PageMarginTexts = {
  top: string
  right: string
  bottom: string
  left: string
}

export type PageMarginSide = keyof PageMarginTexts

export type PageSettings = {
  sizeId: PageSizeId
  widthMm: number
  heightMm: number
  orientation: PageOrientation
  margins: PageMarginsMm
  /** Text drawn in the margin bands (HTML + PDF). */
  marginTexts: PageMarginTexts
  background: string
  /** Default larger body/label size (px) — same unit as block `fontSizePx`. */
  defaultFontSizeLarge: number
  /** Default smaller dense size (px) — same unit as block `fontSizePx`. */
  defaultFontSizeSmall: number
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

/** Matches TextStyleEditor px range and FONT_SIZE_PRESETS (Normal / Pequeño). */
export const PAGE_FONT_SIZE_MIN = 8
export const PAGE_FONT_SIZE_MAX = 72
export const DEFAULT_FONT_SIZE_LARGE_PX = 9
export const DEFAULT_FONT_SIZE_SMALL_PX = 8

/** Default left-margin band for new templates (single line). */
export const DEFAULT_LEFT_MARGIN_TEXT =
  'PROVEEDOR TECNOLÓGICO: BTW S.A.S. NIT 900665411 - INFORMACIÓN FACTURACIÓN ERP: NA'

export function emptyMarginTexts(): PageMarginTexts {
  return { top: '', right: '', bottom: '', left: '' }
}

export function defaultMarginTexts(): PageMarginTexts {
  return {
    ...emptyMarginTexts(),
    left: DEFAULT_LEFT_MARGIN_TEXT,
  }
}

export function defaultPageSettings(): PageSettings {
  return {
    sizeId: 'carta',
    widthMm: 216,
    heightMm: 279,
    orientation: 'vertical',
    /** Left is wider so default margin text fits after -90deg rotate. */
    margins: { top: 5, right: 5, bottom: 5, left: 10 },
    marginTexts: defaultMarginTexts(),
    background: '#ffffff',
    defaultFontSizeLarge: DEFAULT_FONT_SIZE_LARGE_PX,
    defaultFontSizeSmall: DEFAULT_FONT_SIZE_SMALL_PX,
  }
}

function normalizeMarginTexts(
  partial?: Partial<PageMarginTexts> | null,
): PageMarginTexts {
  const base = emptyMarginTexts()
  return {
    top: typeof partial?.top === 'string' ? partial.top : base.top,
    right: typeof partial?.right === 'string' ? partial.right : base.right,
    bottom: typeof partial?.bottom === 'string' ? partial.bottom : base.bottom,
    left: typeof partial?.left === 'string' ? partial.left : base.left,
  }
}

function clampFontSizePx(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return Math.min(PAGE_FONT_SIZE_MAX, Math.max(PAGE_FONT_SIZE_MIN, value))
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
    marginTexts: normalizeMarginTexts(
      partial?.marginTexts ?? base.marginTexts,
    ),
    background: partial?.background || base.background,
    defaultFontSizeLarge: clampFontSizePx(
      partial?.defaultFontSizeLarge,
      base.defaultFontSizeLarge,
    ),
    defaultFontSizeSmall: clampFontSizePx(
      partial?.defaultFontSizeSmall,
      base.defaultFontSizeSmall,
    ),
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

function encodeMarkerText(value: string): string {
  return encodeURIComponent(value)
}

function decodeMarkerText(value: string | undefined): string {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function buildMarker(page: PageSettings): string {
  const t = page.marginTexts
  return `${PAGE_MARKER}sizeId=${page.sizeId};orientation=${page.orientation};width=${page.widthMm};height=${page.heightMm};mt=${page.margins.top};mr=${page.margins.right};mb=${page.margins.bottom};ml=${page.margins.left};bg=${page.background};fsLarge=${page.defaultFontSizeLarge};fsSmall=${page.defaultFontSizeSmall};txtTop=${encodeMarkerText(t.top)};txtRight=${encodeMarkerText(t.right)};txtBottom=${encodeMarkerText(t.bottom)};txtLeft=${encodeMarkerText(t.left)} */`
}

export function buildPageCss(page: PageSettings): string {
  const p = normalizePageSettings(page)
  const { widthMm, heightMm, margins, background } = p
  const small = p.defaultFontSizeSmall
  /** Inset along the margin strip (from content corners / side edges). */
  const padAlongMm = 2.5
  /** Light inset toward page edge and content box (top/bottom bands). */
  const padAcrossMm = 1
  const contentHeightMm = Math.max(0, heightMm - margins.top - margins.bottom)
  const contentWidthMm = Math.max(0, widthMm - margins.left - margins.right)
  /** Usable length along the vertical margin strip (after left/right rotate). */
  const verticalRunMm = Math.max(0, contentHeightMm - padAlongMm * 2)
  /** Usable width for top/bottom horizontal text. */
  const horizontalRunMm = Math.max(0, contentWidthMm - padAlongMm * 2)
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
  position: relative;
  width: ${widthMm}mm;
  min-height: ${heightMm}mm;
  box-sizing: border-box;
  padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
  background: ${background};
  margin: 0 auto 16px;
  box-shadow: 0 0 0 1px #e4e2de;
  overflow: visible;
}
.page-break {
  page-break-before: always;
  break-before: page;
}

.page-margin-text {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
  font-size: ${small}px;
  line-height: 1.15;
  color: #1c1412;
}
.page-margin-text__inner {
  display: block;
  white-space: pre;
  text-align: center;
}
/* Top / bottom: horizontal, centered in content width */
.page-margin-text--top,
.page-margin-text--bottom {
  left: ${margins.left}mm;
  right: ${margins.right}mm;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-left: ${padAlongMm}mm;
  padding-right: ${padAlongMm}mm;
}
.page-margin-text--top {
  top: 0;
  height: ${margins.top}mm;
  padding-top: ${padAcrossMm}mm;
  padding-bottom: ${padAcrossMm}mm;
}
.page-margin-text--bottom {
  bottom: 0;
  height: ${margins.bottom}mm;
  padding-top: ${padAcrossMm}mm;
  padding-bottom: ${padAcrossMm}mm;
}
.page-margin-text--top .page-margin-text__inner,
.page-margin-text--bottom .page-margin-text__inner {
  max-width: ${horizontalRunMm}mm;
  overflow: hidden;
  text-overflow: ellipsis;
}
/*
 * Left / right: margin-band inset + absolute center + rotate.
 * Avoid flex+rotate alone: a long pre-rotate box is clipped by the narrow
 * band width (overflow:hidden) before paint, so vertical text disappears.
 */
.page-margin-text--left,
.page-margin-text--right {
  top: ${margins.top}mm;
  bottom: ${margins.bottom}mm;
  overflow: visible;
}
.page-margin-text--left {
  left: 0;
  width: ${margins.left}mm;
}
.page-margin-text--right {
  right: 0;
  width: ${margins.right}mm;
}
.page-margin-text--left .page-margin-text__inner,
.page-margin-text--right .page-margin-text__inner {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  /* Pre-rotate width = length along the page after rotate */
  width: ${verticalRunMm}mm;
  max-width: ${verticalRunMm}mm;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform-origin: center center;
}
.page-margin-text--left .page-margin-text__inner {
  /* Vertical, reading upward */
  transform: translate(-50%, -50%) rotate(-90deg);
}
.page-margin-text--right .page-margin-text__inner {
  /* Vertical, reading downward */
  transform: translate(-50%, -50%) rotate(90deg);
}`
}

export function buildDocumentContentCss(page?: PageSettings): string {
  const p = normalizePageSettings(page)
  const large = p.defaultFontSizeLarge
  const small = p.defaultFontSizeSmall
  return `body {
  font-family: "DM Sans", "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: ${large}px;
  line-height: 1.3;
  color: #1c1412;
}

.page {
  box-shadow: none;
}

.container {
  margin: 0 0 4px;
  border-radius: 0;
}

.container-title,
.datos-title {
  margin: 0 0 4px;
  font-size: ${large}px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
  color: #111;
  border-bottom: none;
  padding-bottom: 0;
}

.container-grid {
  display: grid;
  gap: 6px;
  align-items: start;
}

.container-cell {
  min-width: 0;
}

.container-cell.align-centro .html-note,
.container-cell.align-centro .logo-box,
.container-cell.align-centro .qr-wrap {
  margin-left: auto;
  margin-right: auto;
}

.container-cell.align-derecha .html-note,
.container-cell.align-derecha .logo-box,
.container-cell.align-derecha .qr-wrap {
  margin-left: auto;
}

.container-grid.cols-1 { grid-template-columns: 1fr; }
.container-grid.cols-2 { grid-template-columns: 1.15fr 1fr; }
.container-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
.container-grid.cols-4 { grid-template-columns: 1fr 1fr 0.75fr 1fr; }

.logo-box {
  width: 100%;
  min-height: 72px;
  max-width: 100px;
  margin: 0 auto;
  border: 1px solid #ccc;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: ${large}px;
  font-weight: 700;
  color: #666;
  text-align: center;
  padding: 4px;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 4px;
}

.datos {
  margin: 0 0 4px;
}

.datos-stack .datos-row-stack {
  margin: 1px 0;
}

.datos-filas {
  /* layout por defecto: filas etiqueta|valor */
}

.datos-fiscal {
  background: transparent;
  margin: 2px 0 6px;
}

.datos-totales {
  margin-left: auto;
  width: min(100%, 220px);
}

.datos-totales .datos-row {
  border-bottom: 1px solid #ddd;
  padding: 1px 0;
}

.datos-row {
  align-items: baseline;
}

.datos-label {
  color: #333;
  font-weight: 700;
  margin-right: 0.15em;
}

table.invoice-table,
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 4px 0 6px;
  font-size: ${small}px;
}

table.invoice-table th,
table.invoice-table td,
th, td {
  border: 1px solid #555;
  padding: 3px 4px;
  vertical-align: top;
}

table.invoice-table th,
th {
  background: #efefef;
  font-weight: 700;
  text-align: center;
}

.note {
  margin: 4px 0;
  line-height: 1.35;
}

.html-note {
  margin: 4px 0;
}

.html-note img {
  display: block;
}

.fiscal-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 10px;
  align-items: start;
  border: 1px dashed #b98c00;
  background: #fffdf4;
  padding: 8px;
  margin: 8px 0;
}

.doc-title {
  text-align: center;
  margin: 8px 0 4px;
}

.footer-tech {
  margin-top: 12px;
  padding-top: 6px;
  border-top: 1px solid #ccc;
  font-size: ${small}px;
  color: #555;
}`
}

export function buildFullDocumentCss(page: PageSettings): string {
  return `${buildPageCss(page)}

${buildDocumentContentCss(page)}`
}

/** Escape HTML but keep `{{path}}` / `{{path|format}}` tokens for the binder. */
export function escapeHtmlLeavingPlaceholders(text: string): string {
  return text.replace(/\{\{[^{}]+\}\}|[^{]+|\{+/g, (chunk) => {
    if (/^\{\{[^{}]+\}\}$/.test(chunk)) return chunk
    return chunk
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  })
}

export function hasMarginTexts(page: PageSettings): boolean {
  const t = normalizePageSettings(page).marginTexts
  return Boolean(t.top.trim() || t.right.trim() || t.bottom.trim() || t.left.trim())
}

/** Absolute margin-band markup injected inside each `.page` (Preview + Playwright). */
export function buildMarginTextsHtml(page: PageSettings): string {
  const p = normalizePageSettings(page)
  const sides: PageMarginSide[] = ['top', 'right', 'bottom', 'left']
  const parts: string[] = []
  for (const side of sides) {
    const raw = p.marginTexts[side].trim()
    if (!raw) continue
    const content = escapeHtmlLeavingPlaceholders(raw)
    parts.push(
      `<div class="page-margin-text page-margin-text--${side}" aria-hidden="true"><span class="page-margin-text__inner">${content}</span></div>`,
    )
  }
  return parts.join('\n')
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
    marginTexts: {
      top: decodeMarkerText(parts.txtTop),
      right: decodeMarkerText(parts.txtRight),
      bottom: decodeMarkerText(parts.txtBottom),
      left: decodeMarkerText(parts.txtLeft),
    },
    background: parts.bg || undefined,
    defaultFontSizeLarge: Number(parts.fsLarge) || undefined,
    defaultFontSizeSmall: Number(parts.fsSmall) || undefined,
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

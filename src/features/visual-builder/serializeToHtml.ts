import {
  applyPageOrientation,
  buildFullDocumentCss,
  defaultPageSettings,
  normalizePageSettings,
  type PageOrientation,
  type PageSettings,
} from './pageSettings'
import { boxStyleToInline, resolveBoxStyle } from './boxStyle'
import {
  normalizeCellAlign,
  normalizeCellVAlign,
  parseColumnWidths,
  stringifyColumnWidths,
} from './containerLayout'
import {
  getBlockContentStyle,
  getBlockTitleStyle,
  parseDatosFields,
  parseTableColumns,
  type Align,
  type TemplateBlock,
} from './types'
import { textStyleToInline, type TextStyle } from './textStyle'

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function token(path: string, format: string): string {
  if (format === 'moneda') return `{{${path}|moneda}}`
  if (format === 'fecha') return `{{${path}|fecha}}`
  return `{{${path}}}`
}

function styled(tag: string, style: TextStyle, content: string, className?: string): string {
  const cls = className ? ` class="${className}"` : ''
  return `<${tag}${cls} style="${textStyleToInline(style)}">${content}</${tag}>`
}

function renderDatosValue(mode: string, value: string, format: string): string {
  if (mode === 'campo') return token(value, format)
  return esc(value)
}

function alignCss(align: Align | string): string {
  if (align === 'centro') return 'center'
  if (align === 'derecha') return 'right'
  return 'left'
}

function formatFieldLabel(label: string): string {
  const text = label.trim()
  if (!text) return ''
  return text.endsWith(':') ? text : `${text}:`
}

function renderLeaf(block: TemplateBlock): string {
  const p = block.props
  const box = resolveBoxStyle(p)
  const boxInline = boxStyleToInline(box)

  switch (block.type) {
    case 'datos': {
      const fields = parseDatosFields(p.fieldsJson)
      const titleStyle = getBlockTitleStyle(block)
      const labelWidth = Math.max(40, Number(p.labelWidth) || 120)
      const gapRaw = Number(p.labelValueGap)
      const labelValueGap = Number.isFinite(gapRaw) ? Math.max(0, gapRaw) : 8
      const presentation = String(p.presentation || 'filas')
      const layout =
        presentation === 'caja' ? 'stack' : presentation
      const variantClass =
        layout === 'stack'
          ? 'datos-stack'
          : layout === 'totales'
            ? 'datos-totales'
            : layout === 'fiscal'
              ? 'datos-fiscal'
              : 'datos-filas'

      const rows = fields
        .map((field) => {
          const valueHtml = styled(
            'span',
            field.valueStyle,
            renderDatosValue(field.mode, field.value, field.format),
            'datos-value',
          )
          const labelText = formatFieldLabel(field.label)
          if (!labelText) {
            return `<div class="datos-row datos-row-stack">${valueHtml}</div>`
          }
          const labelHtml = styled(
            'span',
            field.labelStyle,
            esc(labelText),
            'datos-label',
          )
          // stack / fiscal: etiqueta y valor en la misma línea (Etiqueta: valor)
          if (layout === 'stack' || layout === 'fiscal') {
            return `<div class="datos-row datos-row-stack">${labelHtml} ${valueHtml}</div>`
          }
          const rowStyle = `display:grid;grid-template-columns:${labelWidth}px 1fr;gap:${labelValueGap}px;margin:3px 0;align-items:baseline`
          return `<div class="datos-row" style="${rowStyle}">${labelHtml}${valueHtml}</div>`
        })
        .join('\n')

      return `<section class="datos ${variantClass}" data-block="${block.id}" style="${boxInline}">
  ${p.title ? styled('h2', titleStyle, esc(p.title), 'datos-title') : ''}
  ${rows}
</section>`
    }
    case 'tabla': {
      const columns = parseTableColumns(p.columnsJson)
      const head = columns
        .map((column) =>
          styled('th', column.headerStyle, esc(column.title)),
        )
        .join('')
      const cells = columns
        .map((column) =>
          styled('td', column.cellStyle, `{{${esc(column.property)}}}`),
        )
        .join('')
      return `<div class="table-wrap" data-block="${block.id}" style="${boxInline}">
<table class="invoice-table">
  <thead><tr>${head}</tr></thead>
  <tbody>
    {{#each ${esc(p.arrayPath)}}}
    <tr>${cells}</tr>
    {{/each}}
  </tbody>
</table>
</div>`
    }
    case 'texto': {
      const style = getBlockContentStyle(block)
      const content = String(p.content ?? '')
      if (content.startsWith('@@html:')) {
        return `<div class="note html-note" data-block="${block.id}" style="${boxInline}">${content.slice(7)}</div>`
      }
      return `<div class="note-wrap" data-block="${block.id}" style="${boxInline}">${styled('p', style, esc(content), 'note')}</div>`
    }
    case 'imagen': {
      const width = Math.max(24, Number(p.width) || 120)
      const height = Math.max(24, Number(p.height) || 120)
      const align = alignCss(String(p.align || 'centro'))
      const sourceMode = String(p.sourceMode || 'upload')
      const assetId = String(p.assetId || '').trim()
      const srcPath = String(p.srcPath || '').trim()
      let tokenSrc = ''
      if (sourceMode === 'campo' && srcPath) {
        tokenSrc = `{{${srcPath}}}`
      } else if (assetId) {
        tokenSrc = `{{asset:${assetId}}}`
      }
      return `<div class="image-block" data-block="${block.id}" style="text-align:${align}">
  ${
    tokenSrc
      ? `<img src="${tokenSrc}" alt="" width="${width}" height="${height}" style="max-width:100%;height:auto;width:${width}px" />`
      : `<div class="image-placeholder" style="width:${width}px;height:${height}px;margin:0 auto;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888">Sin imagen</div>`
  }
</div>`
    }
    case 'qr': {
      const width = Math.max(24, Number(p.width) || 80)
      const height = Math.max(24, Number(p.height) || 80)
      const align = alignCss(String(p.align || 'centro'))
      const sourceMode = String(p.sourceMode || 'dian')
      const srcPath = String(p.srcPath || 'documento.qrUrl').trim()
      const staticUrl = String(p.staticUrl || '').trim()
      let tokenSrc = ''
      if (sourceMode === 'url' && staticUrl) {
        tokenSrc = `{{qrFixed:${encodeURIComponent(staticUrl)}}}`
      } else if (srcPath) {
        tokenSrc = `{{${srcPath}|qr}}`
      }
      return `<div class="image-block qr-wrap" data-block="${block.id}" style="text-align:${align}">
  ${
    tokenSrc
      ? `<img src="${tokenSrc}" alt="Código QR" width="${width}" height="${height}" style="max-width:100%;height:auto;width:${width}px" />`
      : `<div class="image-placeholder" style="width:${width}px;height:${height}px;margin:0 auto;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888">Sin QR</div>`
  }
</div>`
    }
    case 'espacio':
      return `<div class="spacer" data-block="${block.id}" style="height:${Number(p.size) || 16}px"></div>`
    default:
      return ''
  }
}

function renderContainer(block: TemplateBlock): string {
  const children = block.children ?? []
  const count = children.length
  const padding = Number(block.props.padding) || 0
  const border = Boolean(block.props.border)
  const borderRadius = Math.max(0, Number(block.props.borderRadius) || 0)
  const background = String(block.props.background || '#ffffff')
  const titleStyle = getBlockTitleStyle(block)

  if (count === 0) {
    return `<section class="container" data-block="${block.id}" style="padding:${padding}px;background:${esc(background)};border:${border ? '1px solid #e4e2de' : '0'};border-radius:${borderRadius}px"></section>`
  }

  const widths = parseColumnWidths(block.props.columnWidths, count)
  const gridColumns = widths.map((n) => `${n}fr`).join(' ')

  const colsHtml = children
    .map((child) => {
      const cellAlign = normalizeCellAlign(child.props.cellAlign)
      const cellVAlign = normalizeCellVAlign(child.props.cellVAlign)
      const textAlign = alignCss(cellAlign)
      const justify =
        cellVAlign === 'centro'
          ? 'center'
          : cellVAlign === 'abajo'
            ? 'flex-end'
            : 'flex-start'
      return `<div class="container-cell align-${cellAlign} valign-${cellVAlign}" style="text-align:${textAlign};min-width:0;display:flex;flex-direction:column;justify-content:${justify}">
  ${renderLeaf(child)}
</div>`
    })
    .join('\n')

  return `<section class="container" data-block="${block.id}" style="padding:${padding}px;background:${esc(background)};border:${border ? '1px solid #e4e2de' : '0'};border-radius:${borderRadius}px">
  ${block.props.title ? styled('h2', titleStyle, esc(block.props.title), 'container-title') : ''}
  <div class="container-grid" style="display:grid;gap:6px;grid-template-columns:${gridColumns};align-items:stretch" data-widths="${esc(stringifyColumnWidths(widths))}">
  ${colsHtml}
  </div>
</section>`
}

function renderBlock(block: TemplateBlock): string {
  if (block.type === 'salto') return ''
  if (block.type === 'contenedor') return renderContainer(block)
  return renderLeaf(block)
}

function splitIntoPages(
  blocks: TemplateBlock[],
  documentOrientation: PageOrientation,
): { orientation: PageOrientation; blocks: TemplateBlock[] }[] {
  const pages: { orientation: PageOrientation; blocks: TemplateBlock[] }[] = []
  let current: { orientation: PageOrientation; blocks: TemplateBlock[] } = {
    orientation: documentOrientation,
    blocks: [],
  }

  for (const block of blocks) {
    if (block.type === 'salto') {
      pages.push(current)
      const nextOrient = String(block.props.orientation || '')
      current = {
        orientation:
          nextOrient === 'horizontal' || nextOrient === 'vertical'
            ? nextOrient
            : documentOrientation,
        blocks: [],
      }
      continue
    }
    current.blocks.push(block)
  }
  pages.push(current)
  return pages.filter((page, index) => page.blocks.length > 0 || index === 0)
}

/** @deprecated use buildFullDocumentCss from pageSettings */
export const DOCUMENT_CSS = buildFullDocumentCss(defaultPageSettings())

export function serializeBlocksToDocument(
  blocks: TemplateBlock[],
  page: PageSettings = defaultPageSettings(),
): {
  html: string
  css: string
} {
  const base = normalizePageSettings(page)
  const pages = splitIntoPages(blocks, base.orientation)

  const body = pages
    .map((section, index) => {
      const sectionPage = applyPageOrientation(base, section.orientation)
      const dims = normalizePageSettings(sectionPage)
      const breakClass = index > 0 ? ' page-break' : ''
      const content = section.blocks.map(renderBlock).join('\n\n')
      return `<div class="page${breakClass}" data-orientation="${section.orientation}" style="width:${dims.widthMm}mm;min-height:${dims.heightMm}mm;padding:${dims.margins.top}mm ${dims.margins.right}mm ${dims.margins.bottom}mm ${dims.margins.left}mm;background:${esc(dims.background)}">
${content}
</div>`
    })
    .join('\n\n')

  const html = `<!DOCTYPE html>
<html lang="es-CO">
<head>
  <meta charset="UTF-8" />
  <title>Documento</title>
</head>
<body>
${body}
</body>
</html>`
  return { html, css: buildFullDocumentCss(base) }
}

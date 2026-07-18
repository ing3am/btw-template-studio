import {
  buildFullDocumentCss,
  defaultPageSettings,
  type PageSettings,
} from './pageSettings'
import {
  clampColumn,
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

function renderLeaf(block: TemplateBlock): string {
  const p = block.props
  switch (block.type) {
    case 'datos': {
      const fields = parseDatosFields(p.fieldsJson)
      const titleStyle = getBlockTitleStyle(block)
      const labelWidth = Math.max(40, Number(p.labelWidth) || 120)
      const gapRaw = Number(p.labelValueGap)
      const labelValueGap = Number.isFinite(gapRaw) ? Math.max(0, gapRaw) : 8
      const rowStyle = `display:grid;grid-template-columns:${labelWidth}px 1fr;gap:${labelValueGap}px;margin:6px 0;align-items:baseline`
      const rows = fields
        .map(
          (field) =>
            `<div class="datos-row" style="${rowStyle}">${styled('span', field.labelStyle, esc(field.label), 'datos-label')}${styled('span', field.valueStyle, renderDatosValue(field.mode, field.value, field.format), 'datos-value')}</div>`,
        )
        .join('\n')
      return `<section class="datos" data-block="${block.id}">
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
      return `<table data-block="${block.id}">
  <thead><tr>${head}</tr></thead>
  <tbody>
    {{#each ${esc(p.arrayPath)}}}
    <tr>${cells}</tr>
    {{/each}}
  </tbody>
</table>`
    }
    case 'texto': {
      const style = getBlockContentStyle(block)
      return styled('p', style, esc(p.content), 'note')
    }
    case 'imagen': {
      const width = Math.max(24, Number(p.width) || 120)
      const height = Math.max(24, Number(p.height) || 120)
      const align = alignCss(String(p.align || 'izquierda'))
      const src = String(p.srcPath || '').trim()
      const tokenSrc = src ? `{{${src}}}` : ''
      return `<div class="image-block" data-block="${block.id}" style="text-align:${align}">
  <img src="${tokenSrc}" alt="" width="${width}" height="${height}" style="max-width:100%;height:auto;width:${width}px" />
</div>`
    }
    case 'espacio':
      return `<div class="spacer" data-block="${block.id}" style="height:${Number(p.size) || 16}px"></div>`
    default:
      return ''
  }
}

function renderContainer(block: TemplateBlock): string {
  const columns = clampColumn(Number(block.props.columns) || 1, 3)
  const padding = Number(block.props.padding) || 0
  const border = Boolean(block.props.border)
  const background = String(block.props.background || '#ffffff')
  const align = alignCss(String(block.props.align || 'izquierda'))
  const titleStyle = getBlockTitleStyle(block)
  const children = block.children ?? []

  const buckets: TemplateBlock[][] = Array.from({ length: columns }, () => [])
  for (const child of children) {
    const col = clampColumn(Number(child.props.columna) || 1, columns) - 1
    buckets[col].push(child)
  }

  const colsHtml = buckets
    .map(
      (bucket, index) =>
        `<div class="col col-${index + 1}">
  ${bucket.map(renderLeaf).join('\n  ')}
</div>`,
    )
    .join('\n')

  return `<section class="container" data-block="${block.id}" style="padding:${padding}px;background:${esc(background)};border:${border ? '1px solid #e4e2de' : '0'};text-align:${align}">
  ${block.props.title ? styled('h2', titleStyle, esc(block.props.title), 'container-title') : ''}
  <div class="container-grid cols-${columns}">
  ${colsHtml}
  </div>
</section>`
}

function renderBlock(block: TemplateBlock): string {
  if (block.type === 'contenedor') return renderContainer(block)
  return renderLeaf(block)
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
  const body = blocks.map(renderBlock).join('\n\n')
  const html = `<!DOCTYPE html>
<html lang="es-CO">
<head>
  <meta charset="UTF-8" />
  <title>Documento</title>
</head>
<body>
<div class="page">
${body}
</div>
</body>
</html>`
  return { html, css: buildFullDocumentCss(page) }
}

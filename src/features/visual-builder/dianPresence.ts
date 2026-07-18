import {
  getDianLabel,
  requiredDianLabels,
  type DianLabel,
} from './dianLabels'
import {
  createBlock,
  createDatosField,
  fieldFromTag,
  parseDatosFields,
  stringifyDatosFields,
  stringifyTextStyle,
  type TemplateBlock,
} from './types'
import {
  defaultTitleStyle,
  defaultValueStyle,
} from './textStyle'

/** Tags that usually render as value-only (title style), label hidden on PDF. */
const VALUE_ONLY_TAGS = new Set([
  'doc-tipo',
  'doc-numero',
  'emisor-razon',
  'cliente-nombre',
])

export function collectPresentTagIds(blocks: TemplateBlock[]): Set<string> {
  const present = new Set<string>()

  function visit(block: TemplateBlock) {
    const sourceTag = String(block.props.sourceTagId || '')
    if (sourceTag) present.add(sourceTag)

    if (block.type === 'datos') {
      for (const field of parseDatosFields(block.props.fieldsJson)) {
        if (field.tagId) present.add(field.tagId)
        const byPath = requiredDianLabels().find(
          (label) => label.kind === 'field' && label.path === field.value,
        )
        if (byPath) present.add(byPath.id)
      }
    }
    if (block.type === 'imagen' || block.type === 'qr') {
      const tagId = String(block.props.tagId || '')
      if (tagId) present.add(tagId)
      if (block.type === 'qr') present.add('qr')
      const srcPath = String(block.props.srcPath || '')
      const byPath = requiredDianLabels().find(
        (label) => label.kind === 'image' && label.path === srcPath,
      )
      if (byPath) present.add(byPath.id)
    }
    block.children?.forEach(visit)
  }

  blocks.forEach(visit)
  return present
}

export function missingRequiredLabels(blocks: TemplateBlock[]): DianLabel[] {
  const present = collectPresentTagIds(blocks)
  return requiredDianLabels().filter((label) => !present.has(label.id))
}

export function labelFromPaletteId(activeId: string): DianLabel | null {
  if (!activeId.startsWith('label:')) return null
  return getDianLabel(activeId.replace('label:', '')) ?? null
}

/**
 * Crea un bloque Datos alimentado por una etiqueta DIAN.
 * Conserva diseño/funcionalidad de Datos (caja, align, presentation),
 * pero el origen es el catálogo (tagId / panelName).
 */
export function createDatosBlockFromDianLabel(label: DianLabel): TemplateBlock {
  const valueOnly = VALUE_ONLY_TAGS.has(label.id)
  const field = fieldFromTag(label.id, {
    label: valueOnly ? '' : label.label,
    valueStyle: valueOnly
      ? {
          ...defaultValueStyle(),
          fontSizePx: label.id === 'doc-numero' ? 11 : 10,
          bold: true,
          align: 'centro',
        }
      : defaultValueStyle(),
  })

  const block = createBlock('datos')
  block.props = {
    ...block.props,
    title: '',
    panelName: label.label,
    sourceTagId: label.id,
    presentation: 'stack',
    cellAlign: valueOnly ? 'centro' : 'izquierda',
    cellVAlign: 'centro',
    boxBorder: false,
    boxRadius: 0,
    boxPadding: 0,
    fieldsJson: stringifyDatosFields([field]),
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  return block
}

/** Fila lista para agregar a un Datos existente desde una etiqueta. */
export function createFieldFromDianLabel(label: DianLabel) {
  return createDatosField({
    tagId: label.id,
    label: label.label,
    mode: 'campo',
    value: label.path,
    format: label.format,
  })
}

export function isEtiquetaDatosBlock(block: TemplateBlock): boolean {
  if (block.type !== 'datos') return false
  if (String(block.props.sourceTagId || '').trim()) return true
  return parseDatosFields(block.props.fieldsJson).some((field) =>
    Boolean(field.tagId),
  )
}

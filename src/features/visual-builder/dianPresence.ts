import {
  getDianLabel,
  requiredDianLabels,
  type DianLabel,
} from './dianLabels'
import {
  parseDatosFields,
  type TemplateBlock,
} from './types'

export function collectPresentTagIds(blocks: TemplateBlock[]): Set<string> {
  const present = new Set<string>()

  function visit(block: TemplateBlock) {
    if (block.type === 'datos') {
      for (const field of parseDatosFields(block.props.fieldsJson)) {
        if (field.tagId) present.add(field.tagId)
        const byPath = requiredDianLabels().find(
          (label) => label.kind === 'field' && label.path === field.value,
        )
        if (byPath) present.add(byPath.id)
      }
    }
    if (block.type === 'imagen') {
      const tagId = String(block.props.tagId || '')
      if (tagId) present.add(tagId)
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

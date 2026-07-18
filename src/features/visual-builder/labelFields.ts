import {
  createDatosField,
  parseDatosFields,
  stringifyDatosFields,
  type TemplateBlock,
} from './types'
import { extractArrayPaths, extractJsonPaths } from './extractJsonPaths'

export function pathToFieldLabel(path: string): string {
  const last = path.split('.').pop() ?? path
  return last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase())
}

export function guessFormat(path: string): 'ninguno' | 'moneda' | 'fecha' {
  if (/(fecha|date|emision|vencimiento)/i.test(path)) return 'fecha'
  if (/(total|subtotal|iva|valor|precio|monto|rete)/i.test(path)) return 'moneda'
  return 'ninguno'
}

/** Rutas escalares del JSON de ejemplo (sin arrays), para chips de etiquetas. */
export function extractLabelPaths(sampleDataJson: string): string[] {
  const arrays = new Set(extractArrayPaths(sampleDataJson))
  return extractJsonPaths(sampleDataJson).filter((path) => !arrays.has(path))
}

export function groupLabelPaths(paths: string[]): { group: string; paths: string[] }[] {
  const map = new Map<string, string[]>()
  for (const path of paths) {
    const group = path.includes('.') ? path.split('.')[0] : 'documento'
    const list = map.get(group) ?? []
    list.push(path)
    map.set(group, list)
  }
  return [...map.entries()].map(([group, groupPaths]) => ({
    group,
    paths: groupPaths,
  }))
}

export function addCampoToDatosBlock(
  block: TemplateBlock,
  path: string,
): TemplateBlock {
  if (block.type !== 'datos') return block
  const fields = parseDatosFields(block.props.fieldsJson)
  if (fields.some((field) => field.mode === 'campo' && field.value === path)) {
    return block
  }
  fields.push(
    createDatosField({
      label: pathToFieldLabel(path),
      mode: 'campo',
      value: path,
      format: guessFormat(path),
    }),
  )
  return {
    ...block,
    props: {
      ...block.props,
      fieldsJson: stringifyDatosFields(fields),
    },
  }
}

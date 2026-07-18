/** Contenedor = 1 fila; N hijos = N celdas. Anchos relativos (tipo PdfPTable float[]). */

export function parseColumnWidths(raw: unknown, count: number): number[] {
  if (count <= 0) return []
  const parts = String(raw ?? '')
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (parts.length === count) return parts
  return Array.from({ length: count }, () => 1)
}

export function stringifyColumnWidths(widths: number[]): string {
  return widths
    .map((w) => {
      const rounded = Math.round(w * 100) / 100
      return Number.isInteger(rounded) ? String(rounded) : String(rounded)
    })
    .join(',')
}

export function equalWidths(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, () => 1)
}

/** Inserta una celda y reparte peso promedio (no apila en otra fila). */
export function widthsAfterInsert(widths: number[], index: number): number[] {
  if (widths.length === 0) return [1]
  const avg = widths.reduce((sum, w) => sum + w, 0) / widths.length
  const next = [...widths]
  const at = Math.min(Math.max(index, 0), next.length)
  next.splice(at, 0, avg)
  return next
}

export function widthsAfterRemove(widths: number[], index: number): number[] {
  if (index < 0 || index >= widths.length) return widths
  return widths.filter((_, i) => i !== index)
}

export function widthsAfterMove(
  widths: number[],
  from: number,
  to: number,
): number[] {
  if (
    from < 0 ||
    to < 0 ||
    from >= widths.length ||
    to >= widths.length ||
    from === to
  ) {
    return widths
  }
  const next = [...widths]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function widthPercents(widths: number[]): number[] {
  const total = widths.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return widths.map(() => 0)
  return widths.map((w) => Math.round((w / total) * 1000) / 10)
}

export type CellAlign = 'izquierda' | 'centro' | 'derecha'
export type CellVAlign = 'arriba' | 'centro' | 'abajo'

export function normalizeCellAlign(value: unknown): CellAlign {
  if (value === 'centro' || value === 'derecha') return value
  return 'izquierda'
}

export function normalizeCellVAlign(value: unknown): CellVAlign {
  if (value === 'centro' || value === 'abajo') return value
  return 'arriba'
}

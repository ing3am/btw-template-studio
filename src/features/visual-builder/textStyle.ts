export type TextAlign = 'izquierda' | 'centro' | 'derecha'

export type TextStyle = {
  color: string
  fontSizePx: number
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
}

export const FONT_SIZE_PRESETS = [
  { id: 'pequeno', label: 'Pequeño', px: 12 },
  { id: 'normal', label: 'Normal', px: 14 },
  { id: 'grande', label: 'Grande', px: 18 },
  { id: 'titulo', label: 'Título', px: 24 },
] as const

export function defaultLabelStyle(): TextStyle {
  return {
    color: '#7a6b62',
    fontSizePx: 12,
    bold: false,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function defaultValueStyle(): TextStyle {
  return {
    color: '#1c1412',
    fontSizePx: 14,
    bold: true,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function defaultTitleStyle(): TextStyle {
  return {
    color: '#f94c10',
    fontSizePx: 14,
    bold: true,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function defaultBodyStyle(): TextStyle {
  return {
    color: '#7a6b62',
    fontSizePx: 14,
    bold: false,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function defaultHeaderCellStyle(): TextStyle {
  return {
    color: '#1c1412',
    fontSizePx: 13,
    bold: true,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function defaultTableCellStyle(): TextStyle {
  return {
    color: '#1c1412',
    fontSizePx: 13,
    bold: false,
    italic: false,
    underline: false,
    align: 'izquierda',
  }
}

export function normalizeTextStyle(
  value: Partial<TextStyle> | null | undefined,
  fallback: TextStyle,
): TextStyle {
  return {
    color: value?.color || fallback.color,
    fontSizePx:
      typeof value?.fontSizePx === 'number' && value.fontSizePx > 0
        ? value.fontSizePx
        : fallback.fontSizePx,
    bold: typeof value?.bold === 'boolean' ? value.bold : fallback.bold,
    italic: typeof value?.italic === 'boolean' ? value.italic : fallback.italic,
    underline:
      typeof value?.underline === 'boolean'
        ? value.underline
        : fallback.underline,
    align: value?.align ?? fallback.align,
  }
}

export function parseTextStyleJson(
  json: unknown,
  fallback: TextStyle,
): TextStyle {
  if (typeof json !== 'string' || !json.trim()) return { ...fallback }
  try {
    return normalizeTextStyle(JSON.parse(json) as Partial<TextStyle>, fallback)
  } catch {
    return { ...fallback }
  }
}

export function stringifyTextStyle(style: TextStyle): string {
  return JSON.stringify(style)
}

function alignCss(align: TextAlign): string {
  if (align === 'centro') return 'center'
  if (align === 'derecha') return 'right'
  return 'left'
}

export function textStyleToInline(style: TextStyle): string {
  return [
    `color:${style.color}`,
    `font-size:${style.fontSizePx}px`,
    `font-weight:${style.bold ? 700 : 400}`,
    `font-style:${style.italic ? 'italic' : 'normal'}`,
    `text-decoration:${style.underline ? 'underline' : 'none'}`,
    `text-align:${alignCss(style.align)}`,
  ].join(';')
}

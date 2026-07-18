/** Estilos de caja por bloque (borde / radio / padding / fondo) — no CSS global fijo. */

export type BoxStyle = {
  border: boolean
  radius: number
  padding: number
  borderColor: string
  background: string
}

export function resolveBoxStyle(props: Record<string, string | number | boolean>): BoxStyle {
  const presentation = String(props.presentation || '')
  const legacyCaja = presentation === 'caja'
  const border =
    props.boxBorder !== undefined && props.boxBorder !== ''
      ? Boolean(props.boxBorder)
      : legacyCaja
  const radiusRaw = Number(props.boxRadius)
  const radius = Number.isFinite(radiusRaw)
    ? Math.max(0, Math.min(48, radiusRaw))
    : legacyCaja
      ? 8
      : 0
  const paddingRaw = Number(props.boxPadding)
  const padding = Number.isFinite(paddingRaw)
    ? Math.max(0, Math.min(48, paddingRaw))
    : border
      ? 6
      : 0
  const borderColor = String(props.boxBorderColor || '#888888')
  const background = String(props.boxBackground || 'transparent')
  return { border, radius, padding, borderColor, background }
}

export function boxStyleToInline(style: BoxStyle): string {
  const parts = [
    `border:${style.border ? `1px solid ${style.borderColor}` : '0'}`,
    `border-radius:${style.radius}px`,
    `padding:${style.padding}px`,
    `background:${style.background === 'transparent' ? 'transparent' : style.background}`,
  ]
  return parts.join(';')
}

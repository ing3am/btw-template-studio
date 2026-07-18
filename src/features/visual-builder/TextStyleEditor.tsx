import { useMemo, useState } from 'react'
import {
  FONT_SIZE_PRESETS,
  type TextStyle,
  type TextAlign,
} from './textStyle'
import styles from './TextStyleEditor.module.css'

type TextStyleEditorProps = {
  label: string
  value: TextStyle
  onChange: (next: TextStyle) => void
  defaultOpen?: boolean
}

export function TextStyleEditor({
  label,
  value,
  onChange,
  defaultOpen = false,
}: TextStyleEditorProps) {
  const [open, setOpen] = useState(defaultOpen)

  const presetId = useMemo(() => {
    const match = FONT_SIZE_PRESETS.find((item) => item.px === value.fontSizePx)
    return match?.id ?? 'custom'
  }, [value.fontSizePx])

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>Tipografía · {label}</span>
        <span>{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div className={styles.body}>
          <label className={styles.field}>
            <span>Color</span>
            <input
              type="color"
              value={value.color}
              onChange={(event) =>
                onChange({ ...value, color: event.target.value })
              }
            />
          </label>

          <label className={styles.field}>
            <span>Tamaño</span>
            <select
              value={presetId}
              onChange={(event) => {
                const next = event.target.value
                if (next === 'custom') return
                const preset = FONT_SIZE_PRESETS.find((item) => item.id === next)
                if (preset) onChange({ ...value, fontSizePx: preset.px })
              }}
            >
              {FONT_SIZE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.px}px)
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Tamaño (px)</span>
            <input
              type="number"
              min={8}
              max={72}
              value={value.fontSizePx}
              onChange={(event) =>
                onChange({
                  ...value,
                  fontSizePx: Number(event.target.value) || value.fontSizePx,
                })
              }
            />
          </label>

          <div className={styles.toggles}>
            <button
              type="button"
              className={value.bold ? styles.chipActive : styles.chip}
              onClick={() => onChange({ ...value, bold: !value.bold })}
            >
              N
            </button>
            <button
              type="button"
              className={value.italic ? styles.chipActive : styles.chip}
              onClick={() => onChange({ ...value, italic: !value.italic })}
            >
              I
            </button>
            <button
              type="button"
              className={value.underline ? styles.chipActive : styles.chip}
              onClick={() => onChange({ ...value, underline: !value.underline })}
            >
              S
            </button>
          </div>

          <label className={styles.field}>
            <span>Alineación</span>
            <select
              value={value.align}
              onChange={(event) =>
                onChange({
                  ...value,
                  align: event.target.value as TextAlign,
                })
              }
            >
              <option value="izquierda">Izquierda</option>
              <option value="centro">Centro</option>
              <option value="derecha">Derecha</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  )
}

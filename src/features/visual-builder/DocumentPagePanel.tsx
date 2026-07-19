import { useRef, useState } from 'react'
import {
  PAGE_FONT_SIZE_MAX,
  PAGE_FONT_SIZE_MIN,
  PAGE_SIZE_PRESETS,
  applyPageOrientation,
  applyPageSizeId,
  type PageMarginSide,
  type PageSettings,
  type PageSizeId,
} from './pageSettings'
import { extractLabelPaths } from './labelFields'
import styles from './DocumentPagePanel.module.css'

type DocumentPagePanelProps = {
  page: PageSettings
  sampleDataJson: string
  onChange: (next: PageSettings) => void
}

const MARGIN_TEXT_SIDES: {
  side: PageMarginSide
  label: string
  hint: string
}[] = [
  { side: 'top', label: 'Texto margen superior', hint: 'Horizontal' },
  { side: 'bottom', label: 'Texto margen inferior', hint: 'Horizontal' },
  {
    side: 'left',
    label: 'Texto margen izquierdo',
    hint: 'Vertical, lectura hacia arriba',
  },
  {
    side: 'right',
    label: 'Texto margen derecho',
    hint: 'Vertical, lectura hacia abajo',
  },
]

function sizeLabel(page: PageSettings): string {
  if (page.sizeId === 'custom') return 'Personalizado'
  return PAGE_SIZE_PRESETS.find((item) => item.id === page.sizeId)?.label ?? 'Página'
}

function pageSummary(page: PageSettings): string {
  const orient = page.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  const texts = page.marginTexts
  const textCount = [texts.top, texts.right, texts.bottom, texts.left].filter(
    (value) => value.trim(),
  ).length
  const textHint = textCount > 0 ? ` · ${textCount} texto(s) margen` : ''
  return `${sizeLabel(page)} · ${orient} · ${page.widthMm}×${page.heightMm} mm · ${page.defaultFontSizeLarge}/${page.defaultFontSizeSmall}px${textHint}`
}

function insertTokenAtCursor(
  current: string,
  token: string,
  start: number,
  end: number,
): { next: string; caret: number } {
  const before = current.slice(0, start)
  const after = current.slice(end)
  const needsSpaceBefore =
    before.length > 0 && !/\s$/.test(before) && !token.startsWith(' ')
  const needsSpaceAfter =
    after.length > 0 && !/^\s/.test(after) && !token.endsWith(' ')
  const inserted =
    (needsSpaceBefore ? ' ' : '') + token + (needsSpaceAfter ? ' ' : '')
  const next = before + inserted + after
  return { next, caret: before.length + inserted.length }
}

export function DocumentPagePanel({
  page,
  sampleDataJson,
  onChange,
}: DocumentPagePanelProps) {
  const [open, setOpen] = useState(false)
  const paths = extractLabelPaths(sampleDataJson)
  const textAreaRefs = useRef<
    Partial<Record<PageMarginSide, HTMLTextAreaElement | null>>
  >({})

  function updateMarginText(side: PageMarginSide, value: string) {
    onChange({
      ...page,
      marginTexts: {
        ...page.marginTexts,
        [side]: value,
      },
    })
  }

  function insertJsonPath(side: PageMarginSide, path: string) {
    if (!path) return
    const token = `{{${path}}}`
    const el = textAreaRefs.current[side]
    const current = page.marginTexts[side] ?? ''
    if (!el) {
      updateMarginText(side, current ? `${current} ${token}` : token)
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const { next, caret } = insertTokenAtCursor(current, token, start, end)
    updateMarginText(side, next)
    requestAnimationFrame(() => {
      const target = textAreaRefs.current[side]
      if (!target) return
      target.focus()
      target.setSelectionRange(caret, caret)
    })
  }

  return (
    <section className={styles.panel} aria-label="Configuración de página">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.toggleMain}>
          <strong>Documento</strong>
          <span className={styles.meta}>{pageSummary(page)}</span>
        </span>
        <span className={styles.chevron}>{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div className={styles.body}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Tamaño</span>
              <select
                value={page.sizeId}
                onChange={(event) =>
                  onChange(
                    applyPageSizeId(page, event.target.value as PageSizeId),
                  )
                }
              >
                {PAGE_SIZE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Personalizado</option>
              </select>
            </label>

            <div className={styles.field}>
              <span>Orientación</span>
              <div className={styles.orientIcons}>
                <button
                  type="button"
                  className={
                    page.orientation === 'vertical'
                      ? styles.orientBtnActive
                      : styles.orientBtn
                  }
                  onClick={() =>
                    onChange(applyPageOrientation(page, 'vertical'))
                  }
                >
                  <span className={styles.pageIconVertical} aria-hidden />
                  Vertical
                </button>
                <button
                  type="button"
                  className={
                    page.orientation === 'horizontal'
                      ? styles.orientBtnActive
                      : styles.orientBtn
                  }
                  onClick={() =>
                    onChange(applyPageOrientation(page, 'horizontal'))
                  }
                >
                  <span className={styles.pageIconHorizontal} aria-hidden />
                  Horizontal
                </button>
              </div>
            </div>

            {page.sizeId === 'custom' ? (
              <>
                <label className={styles.field}>
                  <span>Ancho (mm)</span>
                  <input
                    type="number"
                    min={40}
                    max={600}
                    value={page.widthMm}
                    onChange={(event) =>
                      onChange({
                        ...page,
                        sizeId: 'custom',
                        widthMm: Number(event.target.value) || page.widthMm,
                      })
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Alto (mm)</span>
                  <input
                    type="number"
                    min={40}
                    max={600}
                    value={page.heightMm}
                    onChange={(event) =>
                      onChange({
                        ...page,
                        sizeId: 'custom',
                        heightMm: Number(event.target.value) || page.heightMm,
                      })
                    }
                  />
                </label>
              </>
            ) : null}

            <label className={styles.field}>
              <span>Margen superior</span>
              <input
                type="number"
                min={0}
                max={80}
                value={page.margins.top}
                onChange={(event) =>
                  onChange({
                    ...page,
                    margins: {
                      ...page.margins,
                      top: Math.max(0, Number(event.target.value) || 0),
                    },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Margen inferior</span>
              <input
                type="number"
                min={0}
                max={80}
                value={page.margins.bottom}
                onChange={(event) =>
                  onChange({
                    ...page,
                    margins: {
                      ...page.margins,
                      bottom: Math.max(0, Number(event.target.value) || 0),
                    },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Margen izquierdo</span>
              <input
                type="number"
                min={0}
                max={80}
                value={page.margins.left}
                onChange={(event) =>
                  onChange({
                    ...page,
                    margins: {
                      ...page.margins,
                      left: Math.max(0, Number(event.target.value) || 0),
                    },
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Margen derecho</span>
              <input
                type="number"
                min={0}
                max={80}
                value={page.margins.right}
                onChange={(event) =>
                  onChange({
                    ...page,
                    margins: {
                      ...page.margins,
                      right: Math.max(0, Number(event.target.value) || 0),
                    },
                  })
                }
              />
            </label>

            <label className={styles.field}>
              <span>Fuente mayor (px)</span>
              <input
                type="number"
                min={PAGE_FONT_SIZE_MIN}
                max={PAGE_FONT_SIZE_MAX}
                value={page.defaultFontSizeLarge}
                onChange={(event) =>
                  onChange({
                    ...page,
                    defaultFontSizeLarge:
                      Number(event.target.value) || page.defaultFontSizeLarge,
                  })
                }
              />
            </label>
            <label className={styles.field}>
              <span>Fuente menor (px)</span>
              <input
                type="number"
                min={PAGE_FONT_SIZE_MIN}
                max={PAGE_FONT_SIZE_MAX}
                value={page.defaultFontSizeSmall}
                onChange={(event) =>
                  onChange({
                    ...page,
                    defaultFontSizeSmall:
                      Number(event.target.value) || page.defaultFontSizeSmall,
                  })
                }
              />
            </label>

            <label className={styles.field}>
              <span>Color de fondo</span>
              <input
                type="color"
                value={page.background}
                onChange={(event) =>
                  onChange({ ...page, background: event.target.value })
                }
              />
            </label>
          </div>

          <div className={styles.marginTexts}>
            <h4 className={styles.marginTextsTitle}>Texto en márgenes</h4>
            <p className={styles.marginTextsHint}>
              Puede mezclar texto libre e insertar campos del JSON (ej.{' '}
              <code>{'{{documento.cufe}}'}</code>). Se dibujan en la franja del
              margen en el preview y el PDF.
            </p>
            {MARGIN_TEXT_SIDES.map(({ side, label, hint }) => (
              <div key={side} className={styles.marginTextBlock}>
                <label className={styles.fieldWide}>
                  <span>
                    {label}{' '}
                    <em className={styles.sideHint}>({hint})</em>
                  </span>
                  <textarea
                    ref={(node) => {
                      textAreaRefs.current[side] = node
                    }}
                    rows={2}
                    value={page.marginTexts[side]}
                    placeholder="Texto libre o campos JSON…"
                    onChange={(event) =>
                      updateMarginText(side, event.target.value)
                    }
                  />
                </label>
                <label className={styles.fieldWide}>
                  <span>Insertar campo JSON</span>
                  <select
                    defaultValue=""
                    aria-label={`Insertar campo en ${label}`}
                    onChange={(event) => {
                      const path = event.target.value
                      event.target.value = ''
                      insertJsonPath(side, path)
                    }}
                  >
                    <option value="" disabled>
                      {paths.length === 0
                        ? 'Sin campos en el JSON'
                        : 'Elegir campo…'}
                    </option>
                    {paths.map((path) => (
                      <option key={path} value={path}>
                        {path}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

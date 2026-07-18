import { useState } from 'react'
import {
  PAGE_SIZE_PRESETS,
  applyPageOrientation,
  applyPageSizeId,
  type PageSettings,
  type PageSizeId,
} from './pageSettings'
import styles from './DocumentPagePanel.module.css'

type DocumentPagePanelProps = {
  page: PageSettings
  onChange: (next: PageSettings) => void
}

function sizeLabel(page: PageSettings): string {
  if (page.sizeId === 'custom') return 'Personalizado'
  return PAGE_SIZE_PRESETS.find((item) => item.id === page.sizeId)?.label ?? 'Página'
}

function pageSummary(page: PageSettings): string {
  const orient = page.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  return `${sizeLabel(page)} · ${orient} · ${page.widthMm}×${page.heightMm} mm`
}

export function DocumentPagePanel({ page, onChange }: DocumentPagePanelProps) {
  const [open, setOpen] = useState(false)

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

            <label className={styles.field}>
              <span>Orientación</span>
              <select
                value={page.orientation}
                onChange={(event) =>
                  onChange(
                    applyPageOrientation(
                      page,
                      event.target.value as PageSettings['orientation'],
                    ),
                  )
                }
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </label>

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
              <span>Fondo</span>
              <input
                type="color"
                value={page.background}
                onChange={(event) =>
                  onChange({ ...page, background: event.target.value })
                }
              />
            </label>
          </div>
        </div>
      ) : null}
    </section>
  )
}

import { useState } from 'react'
import {
  createDatosField,
  getBlockTitleStyle,
  parseDatosFields,
  stringifyDatosFields,
  stringifyTextStyle,
  type DatosField,
  type TemplateBlock,
} from './types'
import { extractJsonPaths } from './extractJsonPaths'
import { getDianLabel } from './dianLabels'
import { TextStyleEditor } from './TextStyleEditor'
import styles from './DatosFieldsEditor.module.css'

type DatosFieldsEditorProps = {
  block: TemplateBlock
  sampleDataJson: string
  showColumnProp?: boolean
  maxColumns?: number
  onChange: (props: TemplateBlock['props']) => void
}

function fieldSummary(field: DatosField): string {
  const catalogLabel = field.tagId ? getDianLabel(field.tagId)?.label : undefined
  const labelText =
    field.label.trim() ||
    catalogLabel ||
    (field.mode === 'campo' ? 'Solo valor' : 'Sin etiqueta')
  const value =
    field.mode === 'campo'
      ? field.value || 'sin campo'
      : field.value || 'sin texto'
  const format = field.format !== 'ninguno' ? ` · ${field.format}` : ''
  return `${labelText} · ${value}${format}`
}

export function DatosFieldsEditor({
  block,
  sampleDataJson,
  showColumnProp = false,
  maxColumns = 3,
  onChange,
}: DatosFieldsEditorProps) {
  const fields = parseDatosFields(block.props.fieldsJson)
  const paths = extractJsonPaths(sampleDataJson)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  function toggleOpen(id: string) {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateFields(next: DatosField[]) {
    onChange({
      ...block.props,
      fieldsJson: stringifyDatosFields(next),
    })
  }

  function updateField(id: string, patch: Partial<DatosField>) {
    updateFields(
      fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    )
  }

  function addField() {
    const field = createDatosField({
      label: 'Nuevo campo',
      mode: 'texto',
      value: '',
    })
    updateFields([...fields, field])
    setOpenIds((current) => new Set(current).add(field.id))
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.field}>
        <span>Título de la sección</span>
        <input
          type="text"
          value={String(block.props.title ?? '')}
          onChange={(event) =>
            onChange({ ...block.props, title: event.target.value })
          }
        />
      </label>

      <label className={styles.field}>
        <span>Diseño de campos</span>
        <select
          value={
            String(block.props.presentation || 'filas') === 'caja'
              ? 'stack'
              : String(block.props.presentation || 'filas')
          }
          onChange={(event) =>
            onChange({
              ...block.props,
              presentation: event.target.value,
            })
          }
        >
          <option value="filas">Filas (etiqueta + valor)</option>
          <option value="stack">Apilado (solo valores)</option>
          <option value="totales">Totales</option>
          <option value="fiscal">Fiscal</option>
        </select>
      </label>

      <div className={styles.layoutRow}>
        <label className={styles.field}>
          <span>Ancho etiqueta (px)</span>
          <input
            type="number"
            min={40}
            max={320}
            value={Number(block.props.labelWidth) || 120}
            onChange={(event) =>
              onChange({
                ...block.props,
                labelWidth: Number(event.target.value) || 120,
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Separación etiqueta–valor (px)</span>
          <input
            type="number"
            min={0}
            max={80}
            value={
              Number.isFinite(Number(block.props.labelValueGap))
                ? Number(block.props.labelValueGap)
                : 8
            }
            onChange={(event) =>
              onChange({
                ...block.props,
                labelValueGap: Math.max(0, Number(event.target.value) || 0),
              })
            }
          />
        </label>
      </div>

      {showColumnProp ? (
        <label className={styles.field}>
          <span>Columna del contenedor</span>
          <select
            value={Number(block.props.columna) || 1}
            onChange={(event) =>
              onChange({ ...block.props, columna: Number(event.target.value) })
            }
          >
            {Array.from({ length: maxColumns }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Columna {index + 1}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <TextStyleEditor
        label="Título de la sección"
        value={getBlockTitleStyle(block)}
        onChange={(titleStyle) =>
          onChange({
            ...block.props,
            titleStyleJson: stringifyTextStyle(titleStyle),
          })
        }
      />

      <div className={styles.listHeader}>
        <h4>Campos</h4>
        <button type="button" className={styles.addBtn} onClick={addField}>
          + Agregar
        </button>
      </div>

      {fields.map((field) => {
        const open = openIds.has(field.id)
        return (
          <article key={field.id} className={styles.row}>
            <button
              type="button"
              className={styles.accordionToggle}
              aria-expanded={open}
              onClick={() => toggleOpen(field.id)}
            >
              <span className={styles.accordionTitle}>{fieldSummary(field)}</span>
              <span>{open ? '−' : '+'}</span>
            </button>

            {open ? (
              <div className={styles.accordionBody}>
                <label className={styles.field}>
                  <span>Etiqueta (vacía = solo valor en el PDF)</span>
                  <input
                    type="text"
                    value={field.label}
                    placeholder={
                      field.tagId
                        ? getDianLabel(field.tagId)?.label || 'Solo valor'
                        : 'Texto antes del valor'
                    }
                    onChange={(event) =>
                      updateField(field.id, { label: event.target.value })
                    }
                  />
                </label>

                <label className={styles.field}>
                  <span>Tipo de valor</span>
                  <select
                    value={field.mode}
                    onChange={(event) => {
                      const mode = event.target.value as DatosField['mode']
                      updateField(field.id, {
                        mode,
                        value:
                          mode === 'campo'
                            ? paths[0] ?? field.value
                            : field.mode === 'campo'
                              ? ''
                              : field.value,
                      })
                    }}
                  >
                    <option value="texto">Texto libre</option>
                    <option value="campo">Campo del JSON</option>
                  </select>
                </label>

                {field.mode === 'texto' ? (
                  <label className={styles.field}>
                    <span>Texto</span>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(event) =>
                        updateField(field.id, { value: event.target.value })
                      }
                    />
                  </label>
                ) : (
                  <label className={styles.field}>
                    <span>Campo del JSON</span>
                    <select
                      value={field.value}
                      onChange={(event) =>
                        updateField(field.id, { value: event.target.value })
                      }
                    >
                      {paths.length === 0 ? (
                        <option value="">Sin campos en el JSON</option>
                      ) : (
                        paths.map((path) => (
                          <option key={path} value={path}>
                            {path}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                )}

                <label className={styles.field}>
                  <span>Formato</span>
                  <select
                    value={field.format}
                    onChange={(event) =>
                      updateField(field.id, {
                        format: event.target.value as DatosField['format'],
                      })
                    }
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="moneda">Moneda (COP)</option>
                    <option value="fecha">Fecha</option>
                  </select>
                </label>

                <TextStyleEditor
                  label="Etiqueta"
                  value={field.labelStyle}
                  onChange={(labelStyle) =>
                    updateField(field.id, { labelStyle })
                  }
                />
                <TextStyleEditor
                  label="Valor"
                  value={field.valueStyle}
                  onChange={(valueStyle) =>
                    updateField(field.id, { valueStyle })
                  }
                />

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() =>
                    updateFields(
                      fields.filter((item) => item.id !== field.id),
                    )
                  }
                >
                  Quitar campo
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

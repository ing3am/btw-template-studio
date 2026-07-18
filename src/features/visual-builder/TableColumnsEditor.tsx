import { useState } from 'react'
import {
  createTableColumn,
  parseTableColumns,
  stringifyTableColumns,
  type TableColumn,
  type TemplateBlock,
} from './types'
import {
  extractArrayPaths,
  extractItemPropertyPaths,
} from './extractJsonPaths'
import { TextStyleEditor } from './TextStyleEditor'
import styles from './DatosFieldsEditor.module.css'

type TableColumnsEditorProps = {
  block: TemplateBlock
  sampleDataJson: string
  showColumnProp?: boolean
  maxColumns?: number
  onChange: (props: TemplateBlock['props']) => void
}

function columnSummary(column: TableColumn): string {
  return `${column.title || 'Sin título'} · ${column.property || 'sin propiedad'}`
}

export function TableColumnsEditor({
  block,
  sampleDataJson,
  showColumnProp = false,
  maxColumns = 3,
  onChange,
}: TableColumnsEditorProps) {
  const columns = parseTableColumns(block.props.columnsJson)
  const arrays = extractArrayPaths(sampleDataJson)
  const arrayPath = String(block.props.arrayPath || arrays[0] || 'items')
  const itemProps = extractItemPropertyPaths(sampleDataJson, arrayPath)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())

  function toggleOpen(id: string) {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateColumns(next: TableColumn[]) {
    onChange({
      ...block.props,
      columnsJson: stringifyTableColumns(next),
    })
  }

  function addColumn() {
    const column = createTableColumn({
      title: 'Nueva',
      property: itemProps[0] ?? '',
    })
    updateColumns([...columns, column])
    setOpenIds((current) => new Set(current).add(column.id))
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.field}>
        <span>Lista del JSON (filas)</span>
        <select
          value={arrayPath}
          onChange={(event) =>
            onChange({ ...block.props, arrayPath: event.target.value })
          }
        >
          {arrays.length === 0 ? (
            <option value="items">items</option>
          ) : (
            arrays.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))
          )}
        </select>
      </label>

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

      <div className={styles.listHeader}>
        <h4>Columnas</h4>
        <button type="button" className={styles.addBtn} onClick={addColumn}>
          + Agregar
        </button>
      </div>

      {columns.map((column, index) => {
        const open = openIds.has(column.id)
        return (
          <article key={column.id} className={styles.row}>
            <button
              type="button"
              className={styles.accordionToggle}
              aria-expanded={open}
              onClick={() => toggleOpen(column.id)}
            >
              <span className={styles.accordionTitle}>
                {columnSummary(column)}
              </span>
              <span>{open ? '−' : '+'}</span>
            </button>

            {open ? (
              <div className={styles.accordionBody}>
                <label className={styles.field}>
                  <span>Título</span>
                  <input
                    type="text"
                    value={column.title}
                    onChange={(event) => {
                      const next = [...columns]
                      next[index] = { ...column, title: event.target.value }
                      updateColumns(next)
                    }}
                  />
                </label>
                <label className={styles.field}>
                  <span>Propiedad del ítem</span>
                  <select
                    value={column.property}
                    onChange={(event) => {
                      const next = [...columns]
                      next[index] = { ...column, property: event.target.value }
                      updateColumns(next)
                    }}
                  >
                    {itemProps.length === 0 ? (
                      <option value={column.property || ''}>
                        {column.property || 'Sin propiedades'}
                      </option>
                    ) : (
                      itemProps.map((prop) => (
                        <option key={prop} value={prop}>
                          {prop}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <TextStyleEditor
                  label="Título de columna"
                  value={column.headerStyle}
                  onChange={(headerStyle) => {
                    const next = [...columns]
                    next[index] = { ...column, headerStyle }
                    updateColumns(next)
                  }}
                />
                <TextStyleEditor
                  label="Celdas"
                  value={column.cellStyle}
                  onChange={(cellStyle) => {
                    const next = [...columns]
                    next[index] = { ...column, cellStyle }
                    updateColumns(next)
                  }}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() =>
                    updateColumns(
                      columns.filter((item) => item.id !== column.id),
                    )
                  }
                >
                  Quitar columna
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GripVertical,
  Trash2,
  Box,
  Table2,
  Type,
  Space,
  Rows3,
  Image as ImageIcon,
  QrCode,
  X,
  Tag,
  BetweenHorizontalStart,
} from 'lucide-react'
import {
  BLOCK_CATALOG,
  createBlock,
  datosPanelHeading,
  getBlockContentStyle,
  getBlockTitleStyle,
  isChildAllowedInContainer,
  parseDatosFields,
  parseTableColumns,
  stringifyDatosFields,
  stringifyTextStyle,
  type BlockType,
  type TemplateBlock,
} from './types'
import { resolveBoxStyle } from './boxStyle'
import {
  builderCollisionDetection,
  normalizeContainerOverId,
  resolveDropHint,
  type DropHint,
} from './dropTarget'
import {
  normalizeCellAlign,
  normalizeCellVAlign,
  parseColumnWidths,
  stringifyColumnWidths,
  widthPercents,
  widthsAfterInsert,
  widthsAfterMove,
  widthsAfterRemove,
  type CellAlign,
  type CellVAlign,
} from './containerLayout'
import { DatosFieldsEditor } from './DatosFieldsEditor'
import { TableColumnsEditor } from './TableColumnsEditor'
import { TextStyleEditor } from './TextStyleEditor'
import { DocumentPagePanel } from './DocumentPagePanel'
import type { PageSettings } from './pageSettings'
import { filterDianLabels, type DianLabel } from './dianLabels'
import {
  labelFromPaletteId,
  missingRequiredLabels,
  createDatosBlockFromDianLabel,
  createFieldFromDianLabel,
  isEtiquetaDatosBlock,
} from './dianPresence'
import {
  type TemplateAsset,
} from '@/features/templates/templateAssets'
import { ImagenPropsPanel } from './ImagenPropsPanel'
import { extractJsonPaths } from './extractJsonPaths'
import styles from './VisualBuilder.module.css'

const ICONS: Record<BlockType, typeof Box> = {
  contenedor: Box,
  datos: Rows3,
  tabla: Table2,
  texto: Type,
  espacio: Space,
  imagen: ImageIcon,
  qr: QrCode,
  salto: BetweenHorizontalStart,
}

type VisualBuilderProps = {
  blocks: TemplateBlock[]
  sampleDataJson: string
  page: PageSettings
  templateId: string
  assets: TemplateAsset[]
  onAssetsChange: (assets: TemplateAsset[]) => void
  onChange: (blocks: TemplateBlock[]) => void
  onPageChange: (page: PageSettings) => void
}

function findBlock(
  blocks: TemplateBlock[],
  id: string,
): { block: TemplateBlock; parentId: string | null } | null {
  for (const block of blocks) {
    if (block.id === id) return { block, parentId: null }
    if (block.children) {
      for (const child of block.children) {
        if (child.id === id) return { block: child, parentId: block.id }
      }
    }
  }
  return null
}

function updateTree(
  blocks: TemplateBlock[],
  id: string,
  updater: (block: TemplateBlock) => TemplateBlock,
): TemplateBlock[] {
  return blocks.map((block) => {
    if (block.id === id) return updater(block)
    if (block.children) {
      return {
        ...block,
        children: block.children.map((child) =>
          child.id === id ? updater(child) : child,
        ),
      }
    }
    return block
  })
}

function removeFromTree(blocks: TemplateBlock[], id: string): TemplateBlock[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) =>
      block.children
        ? {
            ...block,
            children: block.children.filter((child) => child.id !== id),
          }
        : block,
    )
}

function SortableRow({
  block,
  selected,
  nested,
  dropHint,
  onSelect,
  onRemove,
}: {
  block: TemplateBlock
  selected: boolean
  nested?: boolean
  dropHint: DropHint | null
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })
  const Icon = ICONS[block.type]
  const catalog = BLOCK_CATALOG.find((item) => item.type === block.type)
  const isDropTarget = dropHint?.overId === block.id
  const dropClass =
    isDropTarget && dropHint
      ? dropHint.kind === 'field'
        ? styles.dropTargetField
        : styles.dropTargetSibling
      : ''

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={[
        styles.block,
        selected ? styles.blockSelected : '',
        nested ? styles.blockNested : '',
        dropClass,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      {isDropTarget && dropHint ? (
        <span className={styles.dropBadge} data-kind={dropHint.kind}>
          {dropHint.kind === 'field' ? 'Campo' : 'Insertar'}
        </span>
      ) : null}
      <button
        type="button"
        className={styles.grip}
        aria-label="Arrastrar"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className={styles.blockBody}>
        <div className={styles.blockTitle}>
          <Icon size={16} />
          <strong>
            {block.type === 'datos'
              ? datosPanelHeading(block.props.panelName, {
                  fromEtiqueta: isEtiquetaDatosBlock(block),
                })
              : (catalog?.label ?? block.type)}
          </strong>
        </div>
        <p>{summarize(block)}</p>
      </div>
      <button
        type="button"
        className={styles.remove}
        aria-label="Eliminar"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function summarize(block: TemplateBlock): string {
  switch (block.type) {
    case 'contenedor': {
      const n = block.children?.length ?? 0
      const widths = parseColumnWidths(block.props.columnWidths, n)
      const pct = widthPercents(widths)
      return n === 0
        ? 'Fila vacía · suelta celdas'
        : `${n} celdas · ${pct.map((p) => `${p}%`).join(' / ')}`
    }
    case 'datos': {
      const panel = String(block.props.panelName || block.props.title || '')
      const fields = parseDatosFields(block.props.fieldsJson)
      if (isEtiquetaDatosBlock(block)) {
        return `Etiqueta · ${panel || fields[0]?.label || 'DIAN'}`
      }
      return `${panel || 'Sin título'} · ${fields.length} campos`
    }
    case 'tabla':
      return `${block.props.arrayPath} · ${parseTableColumns(block.props.columnsJson).length} columnas`
    case 'texto':
      return String(block.props.content)
    case 'espacio':
      return `${block.props.size}px`
    case 'imagen': {
      const mode = String(block.props.sourceMode || 'upload')
      const asset = String(block.props.assetId || '')
      const path = String(block.props.srcPath || '')
      const src =
        mode === 'campo' ? path || 'Sin campo' : asset ? 'Imagen subida' : 'Sin imagen'
      return `${src} · ${block.props.width}×${block.props.height}`
    }
    case 'qr': {
      const mode = String(block.props.sourceMode || 'dian')
      const detail =
        mode === 'url'
          ? 'URL fija'
          : String(block.props.srcPath || 'documento.qrUrl')
      return `QR · ${detail} · ${block.props.width}×${block.props.height}`
    }
    case 'salto':
      return `Nueva página · ${
        block.props.orientation === 'vertical' ? 'vertical' : 'horizontal'
      }`
    default:
      return block.type
  }
}

function LabelPaletteItem({ label }: { label: DianLabel }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `label:${label.id}`,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={styles.paletteItem}
      style={{ opacity: isDragging ? 0.45 : 1 }}
      {...listeners}
      {...attributes}
    >
      <span className={styles.paletteIcon}>
        {label.kind === 'image' ? <ImageIcon size={16} /> : <Tag size={16} />}
      </span>
      <span>
        <strong>{label.label}</strong>
      </span>
    </button>
  )
}

function patchContainer(
  container: TemplateBlock,
  children: TemplateBlock[],
  widths: number[],
): TemplateBlock {
  return {
    ...container,
    children,
    props: {
      ...container.props,
      columnWidths: stringifyColumnWidths(widths),
    },
  }
}

function CellAlignField({
  value,
  onChange,
}: {
  value: string
  onChange: (align: CellAlign) => void
}) {
  return (
    <label className={styles.field}>
      <span>Horizontal</span>
      <select
        value={normalizeCellAlign(value)}
        onChange={(event) => onChange(normalizeCellAlign(event.target.value))}
      >
        <option value="izquierda">Izquierda</option>
        <option value="centro">Centro</option>
        <option value="derecha">Derecha</option>
      </select>
    </label>
  )
}

function CellVAlignField({
  value,
  onChange,
}: {
  value: string
  onChange: (align: CellVAlign) => void
}) {
  return (
    <label className={styles.field}>
      <span>Vertical</span>
      <select
        value={normalizeCellVAlign(value)}
        onChange={(event) => onChange(normalizeCellVAlign(event.target.value))}
      >
        <option value="arriba">Arriba</option>
        <option value="centro">Centro</option>
        <option value="abajo">Abajo</option>
      </select>
    </label>
  )
}

function CellAlignRow({
  props,
  onChange,
}: {
  props: TemplateBlock['props']
  onChange: (props: TemplateBlock['props']) => void
}) {
  return (
    <div className={styles.layoutRow}>
      <CellAlignField
        value={String(props.cellAlign || 'izquierda')}
        onChange={(cellAlign) => onChange({ ...props, cellAlign })}
      />
      <CellVAlignField
        value={String(props.cellVAlign || 'arriba')}
        onChange={(cellVAlign) => onChange({ ...props, cellVAlign })}
      />
    </div>
  )
}

function BoxStyleFields({
  props,
  onChange,
}: {
  props: TemplateBlock['props']
  onChange: (props: TemplateBlock['props']) => void
}) {
  const box = resolveBoxStyle(props)
  return (
    <div className={styles.boxStyle}>
      <span className={styles.fieldLabel}>Caja del elemento</span>
      <div className={styles.layoutRow}>
        <label className={styles.field}>
          <span>Espaciado interno (px)</span>
          <input
            type="number"
            min={0}
            max={48}
            value={box.padding}
            onChange={(event) =>
              onChange({
                ...props,
                boxPadding: Math.max(0, Number(event.target.value) || 0),
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Color de fondo</span>
          <input
            className={styles.colorInput}
            type="color"
            value={String(props.boxBackground || '#ffffff')}
            onChange={(event) =>
              onChange({
                ...props,
                boxBackground: event.target.value,
              })
            }
          />
        </label>
      </div>
      <div className={styles.layoutRow}>
        <label className={styles.checkInline}>
          <input
            type="checkbox"
            checked={box.border}
            onChange={(event) =>
              onChange({
                ...props,
                boxBorder: event.target.checked,
                boxPadding:
                  props.boxPadding !== undefined
                    ? props.boxPadding
                    : event.target.checked
                      ? 6
                      : 0,
              })
            }
          />
          Mostrar borde
        </label>
        {box.border ? (
          <label className={styles.field}>
            <span>Redondeo (0 = cuadrado)</span>
            <input
              type="number"
              min={0}
              max={48}
              value={box.radius}
              onChange={(event) =>
                onChange({
                  ...props,
                  boxRadius: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </label>
        ) : (
          <div />
        )}
      </div>
      {box.border ? (
        <label className={styles.field}>
          <span>Color de borde</span>
          <input
            className={styles.colorInput}
            type="color"
            value={box.borderColor}
            onChange={(event) =>
              onChange({
                ...props,
                boxBorderColor: event.target.value,
              })
            }
          />
        </label>
      ) : null}
    </div>
  )
}

function WidthSliders({
  widths,
  onChange,
}: {
  widths: number[]
  onChange: (widths: number[]) => void
}) {
  const percents = widthPercents(widths)
  if (widths.length === 0) {
    return (
      <p className={styles.hint}>
        Agrega bloques dentro del contenedor para repartir anchos.
      </p>
    )
  }
  return (
    <div className={styles.widthSliders}>
      <span className={styles.fieldLabel}>Ancho de celdas</span>
      {widths.map((_, index) => (
        <label key={index} className={styles.sliderRow}>
          <span>
            Celda {index + 1} <strong>{percents[index]}%</strong>
          </span>
          <input
            type="range"
            min={5}
            max={90}
            step={1}
            value={Math.min(90, Math.max(5, Math.round(percents[index]) || 5))}
            onChange={(event) => {
              const target = Number(event.target.value)
              const next = percents.map((pct, i) =>
                i === index ? target : Math.max(5, pct),
              )
              onChange(next)
            }}
          />
        </label>
      ))}
      <p className={styles.hint}>
        Reparte el espacio entre celdas de la misma fila (como columnas en Word).
      </p>
    </div>
  )
}

function PaletteItem({ type }: { type: BlockType }) {
  const item = BLOCK_CATALOG.find((entry) => entry.type === type)!
  const Icon = ICONS[type]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={styles.paletteItem}
      style={{ opacity: isDragging ? 0.45 : 1 }}
      {...listeners}
      {...attributes}
    >
      <span className={styles.paletteIcon}>
        <Icon size={16} />
      </span>
      <span>
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
    </button>
  )
}

function RootDrop({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: 'root-drop' })
  return (
    <div
      ref={setNodeRef}
      className={[styles.canvasList, active ? styles.dropTargetRoot : '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

function ContainerDrop({
  id,
  active,
  children,
}: {
  id: string
  active: boolean
  children: ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: `container:${id}` })
  return (
    <div
      ref={setNodeRef}
      className={[
        styles.containerChildren,
        active ? styles.dropTargetContainer : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {active ? (
        <span className={styles.dropBadge} data-kind="container">
          Celda
        </span>
      ) : null}
      {children}
    </div>
  )
}

function PropsPanel({
  selected,
  insideContainer,
  sampleDataJson,
  templateId,
  assets,
  onAssetsChange,
  onChangeProps,
}: {
  selected: TemplateBlock
  insideContainer: boolean
  sampleDataJson: string
  templateId: string
  assets: TemplateAsset[]
  onAssetsChange: (assets: TemplateAsset[]) => void
  onChangeProps: (props: TemplateBlock['props']) => void
}) {
  if (selected.type === 'contenedor') {
    const childCount = selected.children?.length ?? 0
    const widths = parseColumnWidths(selected.props.columnWidths, childCount)
    const titleValue = String(selected.props.title ?? '')
    return (
      <div className={styles.props}>
        <p className={styles.hint}>
          Una fila: cada hijo es una celda. Agregar/quitar redistribuye anchos.
        </p>
        <label className={styles.field}>
          <span>Título (opcional)</span>
          <input
            value={titleValue}
            onChange={(event) =>
              onChangeProps({ ...selected.props, title: event.target.value })
            }
          />
        </label>
        {titleValue.trim() ? (
          <TextStyleEditor
            label="Título"
            value={getBlockTitleStyle(selected)}
            onChange={(titleStyle) =>
              onChangeProps({
                ...selected.props,
                titleStyleJson: stringifyTextStyle(titleStyle),
              })
            }
          />
        ) : null}
        <WidthSliders
          widths={widths}
          onChange={(next) =>
            onChangeProps({
              ...selected.props,
              columnWidths: stringifyColumnWidths(next),
            })
          }
        />
        <div className={styles.layoutRow}>
          <label className={styles.field}>
            <span>Espaciado interno</span>
            <input
              type="number"
              min={0}
              value={Number(selected.props.padding) || 0}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  padding: Number(event.target.value),
                })
              }
            />
          </label>
          <label className={styles.field}>
            <span>Color de fondo</span>
            <input
              className={styles.colorInput}
              type="color"
              value={String(selected.props.background || '#ffffff')}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  background: event.target.value,
                })
              }
            />
          </label>
        </div>
        <div className={styles.layoutRow}>
          <label className={styles.checkInline}>
            <input
              type="checkbox"
              checked={Boolean(selected.props.border)}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  border: event.target.checked,
                })
              }
            />
            Mostrar borde
          </label>
          {Boolean(selected.props.border) ? (
            <label className={styles.field}>
              <span>Redondeo (0 = cuadrado)</span>
              <input
                type="number"
                min={0}
                max={48}
                value={Number(selected.props.borderRadius) || 0}
                onChange={(event) =>
                  onChangeProps({
                    ...selected.props,
                    borderRadius: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </label>
          ) : (
            <div />
          )}
        </div>
      </div>
    )
  }

  if (selected.type === 'datos') {
    return (
      <div className={styles.props}>
        {insideContainer ? (
          <CellAlignRow props={selected.props} onChange={onChangeProps} />
        ) : null}
        <BoxStyleFields props={selected.props} onChange={onChangeProps} />
        <DatosFieldsEditor
          block={selected}
          sampleDataJson={sampleDataJson}
          onChange={onChangeProps}
        />
      </div>
    )
  }

  if (selected.type === 'tabla') {
    return (
      <div className={styles.props}>
        <h3>Tabla</h3>
        {insideContainer ? (
          <CellAlignRow props={selected.props} onChange={onChangeProps} />
        ) : null}
        <BoxStyleFields props={selected.props} onChange={onChangeProps} />
        <TableColumnsEditor
          block={selected}
          sampleDataJson={sampleDataJson}
          onChange={onChangeProps}
        />
      </div>
    )
  }

  if (selected.type === 'imagen') {
    return (
      <ImagenPropsPanel
        selected={selected}
        insideContainer={insideContainer}
        sampleDataJson={sampleDataJson}
        templateId={templateId}
        assets={assets}
        onAssetsChange={onAssetsChange}
        onChangeProps={onChangeProps}
        cellAlignRow={
          insideContainer ? (
            <CellAlignRow props={selected.props} onChange={onChangeProps} />
          ) : null
        }
      />
    )
  }

  if (selected.type === 'qr') {
    const sourceMode = String(selected.props.sourceMode || 'dian')
    const paths = extractJsonPaths(sampleDataJson)
    return (
      <div className={styles.props}>
        <h3>Código QR</h3>
        {insideContainer ? (
          <CellAlignRow props={selected.props} onChange={onChangeProps} />
        ) : null}
        <label className={styles.field}>
          <span>Origen del contenido</span>
          <select
            value={
              sourceMode === 'url' || sourceMode === 'campo' ? sourceMode : 'dian'
            }
            onChange={(event) => {
              const next = event.target.value
              onChangeProps({
                ...selected.props,
                sourceMode: next,
                srcPath:
                  next === 'dian'
                    ? 'documento.qrUrl'
                    : String(selected.props.srcPath || 'documento.qrUrl'),
                tagId: next === 'dian' ? 'qr' : selected.props.tagId || '',
              })
            }}
          >
            <option value="dian">URL DIAN del UBL (recomendado)</option>
            <option value="campo">Otro campo del JSON</option>
            <option value="url">URL fija</option>
          </select>
        </label>
        {sourceMode === 'url' ? (
          <label className={styles.field}>
            <span>URL a codificar en el QR</span>
            <input
              type="url"
              value={String(selected.props.staticUrl || '')}
              placeholder="https://catalogo-vpfe.dian.gov.co/..."
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  staticUrl: event.target.value,
                })
              }
            />
          </label>
        ) : (
          <label className={styles.field}>
            <span>Campo JSON</span>
            <select
              value={String(selected.props.srcPath || 'documento.qrUrl')}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  srcPath: event.target.value,
                })
              }
              disabled={sourceMode === 'dian'}
            >
              <option value="documento.qrUrl">documento.qrUrl</option>
              {paths
                .filter((path) => path !== 'documento.qrUrl')
                .map((path) => (
                  <option key={path} value={path}>
                    {path}
                  </option>
                ))}
            </select>
          </label>
        )}
        <div className={styles.layoutRow}>
          <label className={styles.field}>
            <span>Ancho (px)</span>
            <input
              type="number"
              min={24}
              value={Number(selected.props.width) || 80}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  width: Number(event.target.value) || 80,
                })
              }
            />
          </label>
          <label className={styles.field}>
            <span>Alto (px)</span>
            <input
              type="number"
              min={24}
              value={Number(selected.props.height) || 80}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  height: Number(event.target.value) || 80,
                })
              }
            />
          </label>
        </div>
        <label className={styles.field}>
          <span>Alineación</span>
          <select
            value={String(selected.props.align || 'centro')}
            onChange={(event) =>
              onChangeProps({ ...selected.props, align: event.target.value })
            }
          >
            <option value="izquierda">Izquierda</option>
            <option value="centro">Centro</option>
            <option value="derecha">Derecha</option>
          </select>
        </label>
      </div>
    )
  }

  if (selected.type === 'salto') {
    const orientation =
      selected.props.orientation === 'vertical' ? 'vertical' : 'horizontal'
    return (
      <div className={styles.props}>
        <p className={styles.hint}>
          Inserta una página nueva y elige su orientación.
        </p>
        <span className={styles.fieldLabel}>Orientación de la nueva página</span>
        <div className={styles.orientIcons}>
          <button
            type="button"
            className={
              orientation === 'vertical'
                ? styles.orientBtnActive
                : styles.orientBtn
            }
            onClick={() =>
              onChangeProps({ ...selected.props, orientation: 'vertical' })
            }
          >
            <span className={styles.pageIconVertical} aria-hidden />
            Vertical
          </button>
          <button
            type="button"
            className={
              orientation === 'horizontal'
                ? styles.orientBtnActive
                : styles.orientBtn
            }
            onClick={() =>
              onChangeProps({ ...selected.props, orientation: 'horizontal' })
            }
          >
            <span className={styles.pageIconHorizontal} aria-hidden />
            Horizontal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.props}>
      <h3>{selected.type === 'texto' ? 'Texto' : 'Espacio'}</h3>
      {insideContainer ? (
        <CellAlignRow props={selected.props} onChange={onChangeProps} />
      ) : null}
      {selected.type === 'texto' ? (
        <>
          <BoxStyleFields props={selected.props} onChange={onChangeProps} />
          <label className={styles.field}>
            <span>Contenido</span>
            <textarea
              rows={4}
              value={String(selected.props.content ?? '')}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  content: event.target.value,
                })
              }
            />
          </label>
          <TextStyleEditor
            label="Contenido"
            value={getBlockContentStyle(selected)}
            onChange={(contentStyle) =>
              onChangeProps({
                ...selected.props,
                contentStyleJson: stringifyTextStyle(contentStyle),
              })
            }
          />
        </>
      ) : (
        <label className={styles.field}>
          <span>Alto (px)</span>
          <input
            type="number"
            value={Number(selected.props.size) || 16}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                size: Number(event.target.value),
              })
            }
          />
        </label>
      )}
    </div>
  )
}

export function VisualBuilder({
  blocks,
  sampleDataJson,
  page,
  templateId,
  assets,
  onAssetsChange,
  onChange,
  onPageChange,
}: VisualBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<BlockType | null>(null)
  const [activeLabel, setActiveLabel] = useState<DianLabel | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const [labelQuery, setLabelQuery] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const missingLabels = useMemo(() => missingRequiredLabels(blocks), [blocks])
  const filteredLabels = useMemo(
    () => filterDianLabels(labelQuery),
    [labelQuery],
  )
  const selectedInfo = useMemo(
    () => (selectedId ? findBlock(blocks, selectedId) : null),
    [blocks, selectedId],
  )

  useEffect(() => {
    if (!selectedId) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId])

  const insideContainer = Boolean(selectedInfo?.parentId)

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    setDropHint(null)
    if (id.startsWith('palette:')) {
      setActiveType(id.replace('palette:', '') as BlockType)
      setActiveLabel(null)
      return
    }
    if (id.startsWith('label:')) {
      setActiveLabel(labelFromPaletteId(id))
      setActiveType(null)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    const draggingLabel = activeId.startsWith('label:')
      ? labelFromPaletteId(activeId)
      : null
    const draggingType = activeId.startsWith('palette:')
      ? (activeId.replace('palette:', '') as BlockType)
      : null

    if (!draggingLabel && !draggingType) {
      setDropHint(null)
      return
    }

    setDropHint(
      resolveDropHint(overId, {
        activeLabel: draggingLabel,
        activeType: draggingType,
        locate: (id) => findBlock(blocks, id),
      }),
    )
  }

  function insertBlockAtOver(
    next: TemplateBlock,
    overId: string,
    type: BlockType,
  ) {
    const resolvedOverId = normalizeContainerOverId(overId, type, (id) =>
      findBlock(blocks, id),
    )

    if (resolvedOverId.startsWith('container:')) {
      const containerId = resolvedOverId.replace('container:', '')
      if (!isChildAllowedInContainer(type)) return
      onChange(
        blocks.map((block) => {
          if (block.id !== containerId) return block
          const children = [...(block.children ?? []), next]
          const prevWidths = parseColumnWidths(
            block.props.columnWidths,
            children.length - 1,
          )
          return patchContainer(
            block,
            children,
            widthsAfterInsert(prevWidths, children.length - 1),
          )
        }),
      )
      setSelectedId(next.id)
      return
    }

    if (resolvedOverId === 'root-drop') {
      onChange([...blocks, next])
      setSelectedId(next.id)
      return
    }

    const overRootIndex = blocks.findIndex((block) => block.id === resolvedOverId)
    if (overRootIndex >= 0) {
      const copy = [...blocks]
      copy.splice(overRootIndex + 1, 0, next)
      onChange(copy)
      setSelectedId(next.id)
      return
    }

    const located = findBlock(blocks, resolvedOverId)
    if (located?.parentId && isChildAllowedInContainer(type)) {
      onChange(
        blocks.map((block) => {
          if (block.id !== located.parentId) return block
          const children = [...(block.children ?? [])]
          const idx = children.findIndex((child) => child.id === resolvedOverId)
          const insertAt = idx + 1
          children.splice(insertAt, 0, next)
          const prevWidths = parseColumnWidths(
            block.props.columnWidths,
            children.length - 1,
          )
          return patchContainer(
            block,
            children,
            widthsAfterInsert(prevWidths, insertAt),
          )
        }),
      )
      setSelectedId(next.id)
    }
  }

  function handleLabelDrop(label: DianLabel, overId: string) {
    if (label.kind === 'image' || label.id === 'qr') {
      const qr = createBlock('qr')
      qr.props = {
        ...qr.props,
        sourceMode: 'dian',
        srcPath: label.path || 'documento.qrUrl',
        tagId: 'qr',
        width: 80,
        height: 80,
        cellAlign: 'centro',
        align: 'centro',
      }
      insertBlockAtOver(qr, overId, 'qr')
      return
    }

    const target = findBlock(blocks, overId)
    if (target?.block.type === 'datos') {
      const field = createFieldFromDianLabel(label)
      const fields = parseDatosFields(target.block.props.fieldsJson)
      onChange(
        updateTree(blocks, target.block.id, (block) => ({
          ...block,
          props: {
            ...block.props,
            fieldsJson: stringifyDatosFields([...fields, field]),
            // Si el bloque aún no tiene origen de etiqueta, conserva diseño Datos
            sourceTagId: block.props.sourceTagId || label.id,
            panelName: block.props.panelName || label.label,
          },
        })),
      )
      setSelectedId(target.block.id)
      return
    }

    // Nueva etiqueta = bloque Datos con diseño completo (no texto quemado)
    const datos = createDatosBlockFromDianLabel(label)
    insertBlockAtOver(datos, overId, 'datos')
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveType(null)
    setActiveLabel(null)
    setDropHint(null)
    const { active, over } = event
    const activeId = String(active.id)

    if (!over) return
    const overId = String(over.id)

    const droppedLabel = labelFromPaletteId(activeId)
    if (droppedLabel) {
      handleLabelDrop(droppedLabel, overId)
      return
    }

    if (activeId.startsWith('palette:')) {
      const type = activeId.replace('palette:', '') as BlockType
      const next = createBlock(type)
      insertBlockAtOver(next, overId, type)
      return
    }

    const oldRoot = blocks.findIndex((block) => block.id === activeId)
    const newRoot = blocks.findIndex((block) => block.id === overId)
    if (oldRoot >= 0 && newRoot >= 0 && oldRoot !== newRoot) {
      onChange(arrayMove(blocks, oldRoot, newRoot))
      return
    }

    const activeLoc = findBlock(blocks, activeId)
    const overLoc = findBlock(blocks, overId)
    if (
      activeLoc?.parentId &&
      overLoc?.parentId &&
      activeLoc.parentId === overLoc.parentId
    ) {
      onChange(
        blocks.map((block) => {
          if (block.id !== activeLoc.parentId || !block.children) return block
          const oldIndex = block.children.findIndex((child) => child.id === activeId)
          const newIndex = block.children.findIndex((child) => child.id === overId)
          if (oldIndex < 0 || newIndex < 0) return block
          const children = arrayMove(block.children, oldIndex, newIndex)
          const widths = parseColumnWidths(
            block.props.columnWidths,
            block.children.length,
          )
          return patchContainer(
            block,
            children,
            widthsAfterMove(widths, oldIndex, newIndex),
          )
        }),
      )
    }
  }

  const rootIds = blocks.map((block) => block.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={builderCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveType(null)
        setActiveLabel(null)
        setDropHint(null)
      }}
    >
      <div className={styles.builder}>
        <aside className={styles.palette}>
          <h3>Bloques</h3>
          <p className={styles.hint}>
            Contenedor = una fila. Cada bloque dentro es una celda; ajusta anchos
            con sliders en propiedades.
          </p>
          <div className={styles.paletteList}>
            {BLOCK_CATALOG.map((item) => (
              <PaletteItem key={item.type} type={item.type} />
            ))}
          </div>

          <h3 className={styles.paletteSection}>Etiquetas DIAN</h3>
          <p className={styles.hint}>
            Arrastra a un bloque Datos o al documento.
          </p>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>Buscar etiquetas</span>
            <input
              type="search"
              placeholder="Buscar etiqueta…"
              value={labelQuery}
              onChange={(event) => setLabelQuery(event.target.value)}
            />
          </label>
          <div className={styles.paletteList}>
            {filteredLabels.map((label) => (
              <LabelPaletteItem key={label.id} label={label} />
            ))}
            {filteredLabels.length === 0 ? (
              <p className={styles.hint}>Sin resultados</p>
            ) : null}
          </div>
        </aside>

        <section className={styles.canvas}>
          <DocumentPagePanel page={page} onChange={onPageChange} />
          {missingLabels.length > 0 ? (
            <div className={styles.missingBanner} role="status">
              <strong>
                Faltan {missingLabels.length} etiquetas obligatorias en la
                plantilla
              </strong>
              <span>
                Puedes borrar o mover bloques; este aviso solo indica qué falta
                para completar la representación gráfica. ·{' '}
                {missingLabels.map((item) => item.label).join(' · ')}
              </span>
            </div>
          ) : null}
          <div className={styles.canvasHeader}>
            <h3>Bloques</h3>
            <span>{blocks.length} bloques</span>
          </div>
          {dropHint ? (
            <div className={styles.dropHintBar} data-kind={dropHint.kind} role="status">
              {dropHint.message}
            </div>
          ) : null}
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            <RootDrop active={dropHint?.kind === 'root'}>
              {blocks.length === 0 ? (
                <div className={styles.emptyCanvas}>
                  Arrastra bloques para armar tu documento.
                </div>
              ) : (
                blocks.map((block) => (
                  <div key={block.id}>
                    <SortableRow
                      block={block}
                      selected={selectedId === block.id}
                      dropHint={dropHint}
                      onSelect={() => setSelectedId(block.id)}
                      onRemove={() => {
                        onChange(removeFromTree(blocks, block.id))
                        // Close props dialog — do not auto-select another block
                        // (e.g. a sibling contenedor), which felt like a bug.
                        setSelectedId(null)
                      }}
                    />
                    {block.type === 'contenedor' ? (
                      <ContainerDrop
                        id={block.id}
                        active={
                          dropHint?.kind === 'container' &&
                          dropHint.overId === `container:${block.id}`
                        }
                      >
                        <SortableContext
                          items={(block.children ?? []).map((child) => child.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {(block.children ?? []).length === 0 ? (
                            <p className={styles.containerHint}>
                              Suelta aquí: cada bloque = una celda en la misma fila
                            </p>
                          ) : (
                            (block.children ?? []).map((child) => (
                              <SortableRow
                                key={child.id}
                                block={child}
                                nested
                                dropHint={dropHint}
                                selected={selectedId === child.id}
                                onSelect={() => setSelectedId(child.id)}
                                onRemove={() => {
                                  onChange(
                                    blocks.map((row) => {
                                      if (row.id !== block.id) return row
                                      const children = row.children ?? []
                                      const idx = children.findIndex(
                                        (c) => c.id === child.id,
                                      )
                                      const nextChildren = children.filter(
                                        (c) => c.id !== child.id,
                                      )
                                      const widths = parseColumnWidths(
                                        row.props.columnWidths,
                                        children.length,
                                      )
                                      return patchContainer(
                                        row,
                                        nextChildren,
                                        widthsAfterRemove(widths, idx),
                                      )
                                    }),
                                  )
                                  // Clear selection instead of selecting the parent
                                  // contenedor (that was opening the Contenedor props modal).
                                  setSelectedId(null)
                                }}
                              />
                            ))
                          )}
                        </SortableContext>
                      </ContainerDrop>
                    ) : null}
                  </div>
                ))
              )}
            </RootDrop>
          </SortableContext>
        </section>
      </div>

      {selectedInfo ? (
        <div
          className={styles.propsBackdrop}
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <div
            className={styles.propsDialog}
            role="dialog"
            aria-modal="true"
            aria-label="Propiedades del bloque"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.propsDialogHeader}>
              <div className={styles.propsDialogTitleWrap}>
                <p className={styles.propsDialogEyebrow}>Propiedades</p>
                {selectedInfo.block.type === 'datos' ? (
                  <div className={styles.panelNameRow}>
                    <input
                      className={styles.panelNameInput}
                      type="text"
                      value={String(selectedInfo.block.props.panelName ?? '')}
                      placeholder="Nombre"
                      aria-label="Nombre del bloque de datos"
                      onChange={(event) => {
                        const panelName = event.target.value
                        onChange(
                          updateTree(blocks, selectedInfo.block.id, (block) => ({
                            ...block,
                            props: { ...block.props, panelName },
                          })),
                        )
                      }}
                    />
                    <span className={styles.panelNameSuffix} aria-hidden="true">
                      {isEtiquetaDatosBlock(selectedInfo.block)
                        ? ' · Etiqueta'
                        : ' - Datos'}
                    </span>
                  </div>
                ) : (
                  <h3>
                    {BLOCK_CATALOG.find(
                      (item) => item.type === selectedInfo.block.type,
                    )?.label ?? 'Bloque'}
                  </h3>
                )}
              </div>
              <button
                type="button"
                className={styles.propsClose}
                aria-label="Cerrar propiedades"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </button>
            </header>
            <div className={styles.propsDialogBody}>
              <PropsPanel
                selected={selectedInfo.block}
                insideContainer={insideContainer}
                sampleDataJson={sampleDataJson}
                templateId={templateId}
                assets={assets}
                onAssetsChange={onAssetsChange}
                onChangeProps={(props) => {
                  onChange(
                    updateTree(blocks, selectedInfo.block.id, (block) => ({
                      ...block,
                      props,
                    })),
                  )
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <DragOverlay>
        {activeType ? (
          <div className={styles.overlayChip}>
            {BLOCK_CATALOG.find((item) => item.type === activeType)?.label}
          </div>
        ) : null}
        {activeLabel ? (
          <div className={styles.overlayChip}>{activeLabel.label}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  X,
  Tag,
} from 'lucide-react'
import {
  BLOCK_CATALOG,
  createBlock,
  createDatosField,
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
import { DatosFieldsEditor } from './DatosFieldsEditor'
import { TableColumnsEditor } from './TableColumnsEditor'
import { TextStyleEditor } from './TextStyleEditor'
import { DocumentPagePanel } from './DocumentPagePanel'
import type { PageSettings } from './pageSettings'
import { filterDianLabels, type DianLabel } from './dianLabels'
import { labelFromPaletteId, missingRequiredLabels } from './dianPresence'
import styles from './VisualBuilder.module.css'

const ICONS: Record<BlockType, typeof Box> = {
  contenedor: Box,
  datos: Rows3,
  tabla: Table2,
  texto: Type,
  espacio: Space,
  imagen: ImageIcon,
}

type VisualBuilderProps = {
  blocks: TemplateBlock[]
  sampleDataJson: string
  page: PageSettings
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
  onSelect,
  onRemove,
}: {
  block: TemplateBlock
  selected: boolean
  nested?: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })
  const Icon = ICONS[block.type]
  const catalog = BLOCK_CATALOG.find((item) => item.type === block.type)

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
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
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
          <strong>{catalog?.label ?? block.type}</strong>
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
    case 'contenedor':
      return `${block.props.columns} cols · ${block.children?.length ?? 0} hijos`
    case 'datos':
      return `${block.props.title || 'Sin título'} · ${parseDatosFields(block.props.fieldsJson).length} campos`
    case 'tabla':
      return `${block.props.arrayPath} · ${parseTableColumns(block.props.columnsJson).length} columnas`
    case 'texto':
      return String(block.props.content)
    case 'espacio':
      return `${block.props.size}px`
    case 'imagen':
      return `${block.props.srcPath || 'Sin imagen'} · ${block.props.width}×${block.props.height}`
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

function RootDrop({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'root-drop' })
  return (
    <div
      ref={setNodeRef}
      className={styles.canvasList}
      style={isOver ? { outline: '2px dashed var(--color-accent)' } : undefined}
    >
      {children}
    </div>
  )
}

function ContainerDrop({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${id}` })
  return (
    <div
      ref={setNodeRef}
      className={styles.containerChildren}
      style={
        isOver
          ? { outline: '2px dashed var(--color-accent)', outlineOffset: 2 }
          : undefined
      }
    >
      {children}
    </div>
  )
}

function PropsPanel({
  selected,
  parentColumns,
  sampleDataJson,
  onChangeProps,
}: {
  selected: TemplateBlock
  parentColumns: number | null
  sampleDataJson: string
  onChangeProps: (props: TemplateBlock['props']) => void
}) {
  const showColumn = parentColumns != null && selected.type !== 'contenedor'

  if (selected.type === 'contenedor') {
    return (
      <div className={styles.props}>
        <h3>Contenedor</h3>
        <label className={styles.field}>
          <span>Título (opcional)</span>
          <input
            value={String(selected.props.title ?? '')}
            onChange={(event) =>
              onChangeProps({ ...selected.props, title: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Columnas</span>
          <select
            value={Number(selected.props.columns) || 1}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                columns: Number(event.target.value),
              })
            }
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Padding</span>
          <input
            type="number"
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
          <span>Fondo</span>
          <input
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
        <label className={styles.field}>
          <span>Alineación</span>
          <select
            value={String(selected.props.align || 'izquierda')}
            onChange={(event) =>
              onChangeProps({ ...selected.props, align: event.target.value })
            }
          >
            <option value="izquierda">Izquierda</option>
            <option value="centro">Centro</option>
            <option value="derecha">Derecha</option>
          </select>
        </label>
        <label className={styles.check}>
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
      </div>
    )
  }

  if (selected.type === 'datos') {
    return (
      <div className={styles.props}>
        <h3>Datos</h3>
        <DatosFieldsEditor
          block={selected}
          sampleDataJson={sampleDataJson}
          showColumnProp={showColumn}
          maxColumns={parentColumns ?? 3}
          onChange={onChangeProps}
        />
      </div>
    )
  }

  if (selected.type === 'tabla') {
    return (
      <div className={styles.props}>
        <h3>Tabla</h3>
        <TableColumnsEditor
          block={selected}
          sampleDataJson={sampleDataJson}
          showColumnProp={showColumn}
          maxColumns={parentColumns ?? 3}
          onChange={onChangeProps}
        />
      </div>
    )
  }

  if (selected.type === 'imagen') {
    return (
      <div className={styles.props}>
        <h3>Imagen</h3>
        {showColumn ? (
          <label className={styles.field}>
            <span>Columna del contenedor</span>
            <select
              value={Number(selected.props.columna) || 1}
              onChange={(event) =>
                onChangeProps({
                  ...selected.props,
                  columna: Number(event.target.value),
                })
              }
            >
              {Array.from({ length: parentColumns ?? 1 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Columna {index + 1}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={styles.field}>
          <span>Campo JSON (URL de imagen)</span>
          <input
            type="text"
            value={String(selected.props.srcPath ?? '')}
            onChange={(event) =>
              onChangeProps({ ...selected.props, srcPath: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Ancho (px)</span>
          <input
            type="number"
            min={24}
            value={Number(selected.props.width) || 120}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                width: Number(event.target.value) || 120,
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Alto (px)</span>
          <input
            type="number"
            min={24}
            value={Number(selected.props.height) || 120}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                height: Number(event.target.value) || 120,
              })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Alineación</span>
          <select
            value={String(selected.props.align || 'izquierda')}
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

  return (
    <div className={styles.props}>
      <h3>{selected.type === 'texto' ? 'Texto' : 'Espacio'}</h3>
      {showColumn ? (
        <label className={styles.field}>
          <span>Columna del contenedor</span>
          <select
            value={Number(selected.props.columna) || 1}
            onChange={(event) =>
              onChangeProps({
                ...selected.props,
                columna: Number(event.target.value),
              })
            }
          >
            {Array.from({ length: parentColumns ?? 1 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Columna {index + 1}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {selected.type === 'texto' ? (
        <>
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
  onChange,
  onPageChange,
}: VisualBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<BlockType | null>(null)
  const [activeLabel, setActiveLabel] = useState<DianLabel | null>(null)
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

  const parentColumns = useMemo(() => {
    if (!selectedInfo?.parentId) return null
    const parent = blocks.find((block) => block.id === selectedInfo.parentId)
    return Number(parent?.props.columns) || 1
  }, [blocks, selectedInfo])

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
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

  function insertBlockAtOver(
    next: TemplateBlock,
    overId: string,
    type: BlockType,
  ) {
    if (overId.startsWith('container:')) {
      const containerId = overId.replace('container:', '')
      if (!isChildAllowedInContainer(type)) return
      onChange(
        blocks.map((block) =>
          block.id === containerId
            ? {
                ...block,
                children: [...(block.children ?? []), next],
              }
            : block,
        ),
      )
      setSelectedId(next.id)
      return
    }

    if (overId === 'root-drop') {
      onChange([...blocks, next])
      setSelectedId(next.id)
      return
    }

    const overRootIndex = blocks.findIndex((block) => block.id === overId)
    if (overRootIndex >= 0) {
      const copy = [...blocks]
      copy.splice(overRootIndex + 1, 0, next)
      onChange(copy)
      setSelectedId(next.id)
      return
    }

    const located = findBlock(blocks, overId)
    if (located?.parentId && isChildAllowedInContainer(type)) {
      onChange(
        blocks.map((block) => {
          if (block.id !== located.parentId) return block
          const children = [...(block.children ?? [])]
          const idx = children.findIndex((child) => child.id === overId)
          children.splice(idx + 1, 0, next)
          return { ...block, children }
        }),
      )
      setSelectedId(next.id)
    }
  }

  function handleLabelDrop(label: DianLabel, overId: string) {
    if (label.kind === 'image') {
      const image = createBlock('imagen')
      image.props = {
        ...image.props,
        srcPath: label.path,
        tagId: label.id,
        width: 120,
        height: 120,
      }
      const overBlock = findBlock(blocks, overId)?.block
      if (overBlock?.type === 'datos') {
        insertBlockAtOver(image, overId, 'imagen')
        return
      }
      insertBlockAtOver(image, overId, 'imagen')
      return
    }

    const field = createDatosField({
      tagId: label.id,
      label: label.label,
      mode: 'campo',
      value: label.path,
      format: label.format,
    })

    const target = findBlock(blocks, overId)
    if (target?.block.type === 'datos') {
      const fields = parseDatosFields(target.block.props.fieldsJson)
      onChange(
        updateTree(blocks, target.block.id, (block) => ({
          ...block,
          props: {
            ...block.props,
            fieldsJson: stringifyDatosFields([...fields, field]),
          },
        })),
      )
      setSelectedId(target.block.id)
      return
    }

    const datos = createBlock('datos')
    datos.props = {
      ...datos.props,
      title: label.label,
      fieldsJson: stringifyDatosFields([field]),
    }
    insertBlockAtOver(datos, overId, 'datos')
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveType(null)
    setActiveLabel(null)
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
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

    // reorder root
    const oldRoot = blocks.findIndex((block) => block.id === activeId)
    const newRoot = blocks.findIndex((block) => block.id === overId)
    if (oldRoot >= 0 && newRoot >= 0 && oldRoot !== newRoot) {
      onChange(arrayMove(blocks, oldRoot, newRoot))
      return
    }

    // reorder within same container
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
          return {
            ...block,
            children: arrayMove(block.children, oldIndex, newIndex),
          }
        }),
      )
    }
  }

  const rootIds = blocks.map((block) => block.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.builder}>
        <aside className={styles.palette}>
          <h3>Bloques</h3>
          <p className={styles.hint}>
            Arrastra al documento o dentro de un contenedor.
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
                Faltan {missingLabels.length} etiquetas obligatorias DIAN
              </strong>
              <span>
                {missingLabels.map((item) => item.label).join(' · ')}
              </span>
            </div>
          ) : null}
          <div className={styles.canvasHeader}>
            <h3>Bloques</h3>
            <span>{blocks.length} bloques</span>
          </div>
          <SortableContext items={rootIds} strategy={verticalListSortingStrategy}>
            <RootDrop>
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
                      onSelect={() => setSelectedId(block.id)}
                      onRemove={() => {
                        const next = removeFromTree(blocks, block.id)
                        onChange(next)
                        setSelectedId(next[0]?.id ?? null)
                      }}
                    />
                    {block.type === 'contenedor' ? (
                      <ContainerDrop id={block.id}>
                        <SortableContext
                          items={(block.children ?? []).map((child) => child.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {(block.children ?? []).length === 0 ? (
                            <p className={styles.containerHint}>
                              Suelta aquí Datos, Tabla, Texto o Espacio
                            </p>
                          ) : (
                            (block.children ?? []).map((child) => (
                              <SortableRow
                                key={child.id}
                                block={child}
                                nested
                                selected={selectedId === child.id}
                                onSelect={() => setSelectedId(child.id)}
                                onRemove={() => {
                                  const next = removeFromTree(blocks, child.id)
                                  onChange(next)
                                  setSelectedId(block.id)
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
              <div>
                <p className={styles.propsDialogEyebrow}>Propiedades</p>
                <h3>
                  {BLOCK_CATALOG.find(
                    (item) => item.type === selectedInfo.block.type,
                  )?.label ?? 'Bloque'}
                </h3>
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
                parentColumns={parentColumns}
                sampleDataJson={sampleDataJson}
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

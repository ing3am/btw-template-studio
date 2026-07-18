import {
  defaultBodyStyle,
  defaultHeaderCellStyle,
  defaultLabelStyle,
  defaultTableCellStyle,
  defaultTitleStyle,
  defaultValueStyle,
  normalizeTextStyle,
  parseTextStyleJson,
  stringifyTextStyle,
  type TextStyle,
} from './textStyle'

export type BlockType = 'contenedor' | 'datos' | 'tabla' | 'texto' | 'espacio'

export type DatosFieldMode = 'texto' | 'campo'
export type DatosFormat = 'ninguno' | 'moneda' | 'fecha'
export type Align = 'izquierda' | 'centro' | 'derecha'

export type DatosField = {
  id: string
  label: string
  mode: DatosFieldMode
  value: string
  format: DatosFormat
  labelStyle: TextStyle
  valueStyle: TextStyle
}

export type TableColumn = {
  id: string
  title: string
  property: string
  headerStyle: TextStyle
  cellStyle: TextStyle
}

export type TemplateBlock = {
  id: string
  type: BlockType
  props: Record<string, string | number | boolean>
  children?: TemplateBlock[]
}

export function createDatosField(partial?: Partial<DatosField>): DatosField {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    label: partial?.label ?? 'Campo',
    mode: partial?.mode ?? 'texto',
    value: partial?.value ?? '',
    format:
      partial?.format === 'moneda' || partial?.format === 'fecha'
        ? partial.format
        : 'ninguno',
    labelStyle: normalizeTextStyle(partial?.labelStyle, defaultLabelStyle()),
    valueStyle: normalizeTextStyle(partial?.valueStyle, defaultValueStyle()),
  }
}

export function createTableColumn(partial?: Partial<TableColumn>): TableColumn {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    title: partial?.title ?? 'Columna',
    property: partial?.property ?? '',
    headerStyle: normalizeTextStyle(
      partial?.headerStyle,
      defaultHeaderCellStyle(),
    ),
    cellStyle: normalizeTextStyle(partial?.cellStyle, defaultTableCellStyle()),
  }
}

export function parseDatosFields(fieldsJson: unknown): DatosField[] {
  if (typeof fieldsJson !== 'string' || !fieldsJson.trim()) return []
  try {
    const parsed = JSON.parse(fieldsJson) as Array<Partial<DatosField> & { format?: string }>
    if (!Array.isArray(parsed)) return []
    return parsed.map((field) =>
      createDatosField({
        ...field,
        id: field.id,
        format:
          field.format === 'moneda' || field.format === 'fecha'
            ? field.format
            : 'ninguno',
      }),
    )
  } catch {
    return []
  }
}

export function stringifyDatosFields(fields: DatosField[]): string {
  return JSON.stringify(fields)
}

export function parseTableColumns(columnsJson: unknown): TableColumn[] {
  if (typeof columnsJson !== 'string' || !columnsJson.trim()) return []
  try {
    const parsed = JSON.parse(columnsJson) as Array<Partial<TableColumn>>
    return Array.isArray(parsed)
      ? parsed.map((column) => createTableColumn(column))
      : []
  } catch {
    return []
  }
}

export function stringifyTableColumns(columns: TableColumn[]): string {
  return JSON.stringify(columns)
}

export function getBlockTitleStyle(block: TemplateBlock): TextStyle {
  return parseTextStyleJson(block.props.titleStyleJson, defaultTitleStyle())
}

export function getBlockContentStyle(block: TemplateBlock): TextStyle {
  return parseTextStyleJson(block.props.contentStyleJson, defaultBodyStyle())
}

function clienteFields(): string {
  return stringifyDatosFields([
    createDatosField({ label: 'Nombre', mode: 'campo', value: 'cliente.nombre' }),
    createDatosField({ label: 'NIT', mode: 'campo', value: 'cliente.nit' }),
    createDatosField({ label: 'Ciudad', mode: 'campo', value: 'cliente.ciudad' }),
  ])
}

function emisorFields(): string {
  return stringifyDatosFields([
    createDatosField({
      label: 'Razón social',
      mode: 'campo',
      value: 'emisor.razonSocial',
    }),
    createDatosField({ label: 'NIT', mode: 'campo', value: 'emisor.nit' }),
  ])
}

function headerFields(): string {
  return stringifyDatosFields([
    createDatosField({
      label: 'Documento',
      mode: 'texto',
      value: 'Factura de venta',
      valueStyle: {
        ...defaultValueStyle(),
        fontSizePx: 24,
        bold: true,
      },
    }),
    createDatosField({ label: 'Número', mode: 'campo', value: 'numero' }),
  ])
}

function totalesFields(): string {
  return stringifyDatosFields([
    createDatosField({
      label: 'Subtotal',
      mode: 'campo',
      value: 'totales.subtotal',
      format: 'moneda',
    }),
    createDatosField({
      label: 'IVA',
      mode: 'campo',
      value: 'totales.iva',
      format: 'moneda',
    }),
    createDatosField({
      label: 'Total',
      mode: 'campo',
      value: 'totales.total',
      format: 'moneda',
      valueStyle: { ...defaultValueStyle(), fontSizePx: 18, bold: true },
    }),
  ])
}

function defaultTableColumns(): string {
  return stringifyTableColumns([
    createTableColumn({ title: 'Descripción', property: 'descripcion' }),
    createTableColumn({ title: 'Cant.', property: 'cantidad' }),
    createTableColumn({ title: 'Valor', property: 'valor' }),
  ])
}

export const BLOCK_CATALOG: {
  type: BlockType
  label: string
  description: string
  defaults: Record<string, string | number | boolean>
}[] = [
  {
    type: 'contenedor',
    label: 'Contenedor',
    description: 'Agrupa bloques en 1, 2 o 3 columnas',
    defaults: {
      title: '',
      columns: 2,
      padding: 16,
      border: true,
      background: '#ffffff',
      align: 'izquierda',
      titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
    },
  },
  {
    type: 'datos',
    label: 'Datos',
    description: 'Filas con texto o campos del JSON',
    defaults: {
      title: 'Datos',
      fieldsJson: stringifyDatosFields([
        createDatosField({ label: 'Campo', mode: 'texto', value: '' }),
      ]),
      columna: 1,
      labelWidth: 120,
      labelValueGap: 8,
      titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
    },
  },
  {
    type: 'tabla',
    label: 'Tabla',
    description: 'Columnas sobre una lista del JSON',
    defaults: {
      arrayPath: 'items',
      columnsJson: defaultTableColumns(),
      columna: 1,
    },
  },
  {
    type: 'texto',
    label: 'Texto',
    description: 'Nota o párrafo libre',
    defaults: {
      content: 'Texto de ejemplo',
      columna: 1,
      contentStyleJson: stringifyTextStyle(defaultBodyStyle()),
    },
  },
  {
    type: 'espacio',
    label: 'Espacio',
    description: 'Separación vertical',
    defaults: {
      size: 16,
      columna: 1,
    },
  },
]

export function createBlock(type: BlockType): TemplateBlock {
  const catalog = BLOCK_CATALOG.find((item) => item.type === type)
  const block: TemplateBlock = {
    id: crypto.randomUUID(),
    type,
    props: { ...(catalog?.defaults ?? {}) },
  }
  if (type === 'contenedor') {
    block.children = []
  }
  return block
}

export function createDefaultFacturaBlocks(): TemplateBlock[] {
  const header = createBlock('datos')
  header.props = {
    title: 'Factura',
    fieldsJson: headerFields(),
    columna: 1,
    labelWidth: 120,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const emisor = createBlock('datos')
  emisor.props = {
    title: 'Emisor',
    fieldsJson: emisorFields(),
    columna: 1,
    labelWidth: 120,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const cliente = createBlock('datos')
  cliente.props = {
    title: 'Cliente',
    fieldsJson: clienteFields(),
    columna: 2,
    labelWidth: 120,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const top = createBlock('contenedor')
  top.props = {
    title: '',
    columns: 2,
    padding: 16,
    border: false,
    background: '#ffffff',
    align: 'izquierda',
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  top.children = [emisor, cliente]

  const tabla = createBlock('tabla')
  const totales = createBlock('datos')
  totales.props = {
    title: 'Totales',
    fieldsJson: totalesFields(),
    columna: 1,
    labelWidth: 120,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const nota = createBlock('texto')
  nota.props = {
    content: 'Documento electrónico generado para demo BTW Template Studio.',
    columna: 1,
    contentStyleJson: stringifyTextStyle(defaultBodyStyle()),
  }

  const espacio = createBlock('espacio')

  return [header, top, espacio, tabla, totales, nota]
}

export function clampColumn(column: number, maxColumns: number): number {
  const safe = Number.isFinite(column) ? Math.trunc(column) : 1
  return Math.min(Math.max(safe, 1), Math.max(maxColumns, 1))
}

export function isChildAllowedInContainer(type: BlockType): boolean {
  return type !== 'contenedor'
}

export { stringifyTextStyle, parseTextStyleJson }

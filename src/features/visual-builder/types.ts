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
import { getDianLabel } from './dianLabels'

export type BlockType =
  | 'contenedor'
  | 'datos'
  | 'tabla'
  | 'texto'
  | 'espacio'
  | 'imagen'

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
  /** DIAN catalog id when created from a label */
  tagId?: string
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
    ...(partial?.tagId ? { tagId: partial.tagId } : {}),
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

function fieldFromTag(tagId: string, overrides?: Partial<DatosField>): DatosField {
  const tag = getDianLabel(tagId)
  if (!tag || tag.kind !== 'field') {
    return createDatosField(overrides)
  }
  return createDatosField({
    tagId: tag.id,
    label: tag.label,
    mode: 'campo',
    value: tag.path,
    format: tag.format,
    ...overrides,
  })
}

function clienteFields(): string {
  return stringifyDatosFields([
    fieldFromTag('cliente-nombre'),
    fieldFromTag('cliente-nit'),
    fieldFromTag('cliente-ciudad'),
  ])
}

function emisorFields(): string {
  return stringifyDatosFields([
    fieldFromTag('emisor-razon'),
    fieldFromTag('emisor-nit'),
    fieldFromTag('emisor-responsabilidad'),
  ])
}

function headerFields(): string {
  return stringifyDatosFields([
    fieldFromTag('doc-tipo', {
      valueStyle: { ...defaultValueStyle(), fontSizePx: 12, bold: true },
    }),
    fieldFromTag('doc-numero'),
    fieldFromTag('doc-prefijo'),
    fieldFromTag('cufe'),
  ])
}

function autorizacionFields(): string {
  return stringifyDatosFields([
    fieldFromTag('doc-autorizacion'),
    fieldFromTag('doc-rango-desde'),
    fieldFromTag('doc-rango-hasta'),
    fieldFromTag('doc-vigencia-inicio'),
    fieldFromTag('doc-vigencia-fin'),
    fieldFromTag('doc-fecha-generacion'),
    fieldFromTag('doc-hora-generacion'),
  ])
}

function pagoFields(): string {
  return stringifyDatosFields([
    fieldFromTag('pago-forma'),
    fieldFromTag('pago-medio'),
    fieldFromTag('pago-plazo'),
  ])
}

function totalesFields(): string {
  return stringifyDatosFields([
    fieldFromTag('totales-subtotal'),
    fieldFromTag('totales-iva'),
    fieldFromTag('totales-iva-tarifa'),
    fieldFromTag('totales-consumo'),
    fieldFromTag('totales-consumo-tarifa'),
    fieldFromTag('totales-total', {
      valueStyle: { ...defaultValueStyle(), fontSizePx: 11, bold: true },
    }),
  ])
}

function softwareFields(): string {
  return stringifyDatosFields([
    fieldFromTag('software-fabricante'),
    fieldFromTag('software-fabricante-nit'),
    fieldFromTag('software-nombre'),
    fieldFromTag('software-proveedor'),
  ])
}

function defaultTableColumns(): string {
  return stringifyTableColumns([
    createTableColumn({ title: 'Código', property: 'codigo' }),
    createTableColumn({ title: 'Descripción', property: 'descripcion' }),
    createTableColumn({ title: 'Cant.', property: 'cantidad' }),
    createTableColumn({ title: 'Valor unit.', property: 'valorUnitario' }),
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
      panelName: '',
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
  {
    type: 'imagen',
    label: 'Imagen',
    description: 'Imagen o código QR desde el JSON',
    defaults: {
      srcPath: 'documento.qrUrl',
      width: 120,
      height: 120,
      align: 'izquierda',
      tagId: '',
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
    panelName: 'Factura',
    fieldsJson: headerFields(),
    columna: 1,
    labelWidth: 140,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const autorizacion = createBlock('datos')
  autorizacion.props = {
    title: 'Autorización DIAN',
    panelName: 'Autorización DIAN',
    fieldsJson: autorizacionFields(),
    columna: 1,
    labelWidth: 160,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const emisor = createBlock('datos')
  emisor.props = {
    title: 'Emisor',
    panelName: 'Emisor',
    fieldsJson: emisorFields(),
    columna: 1,
    labelWidth: 140,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const cliente = createBlock('datos')
  cliente.props = {
    title: 'Cliente',
    panelName: 'Cliente',
    fieldsJson: clienteFields(),
    columna: 2,
    labelWidth: 140,
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
    title: 'Totales e impuestos',
    panelName: 'Totales',
    fieldsJson: totalesFields(),
    columna: 1,
    labelWidth: 160,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const pago = createBlock('datos')
  pago.props = {
    title: 'Pago',
    panelName: 'Pago',
    fieldsJson: pagoFields(),
    columna: 1,
    labelWidth: 140,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const software = createBlock('datos')
  software.props = {
    title: 'Software',
    panelName: 'Software',
    fieldsJson: softwareFields(),
    columna: 1,
    labelWidth: 180,
    labelValueGap: 8,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const qr = createBlock('imagen')
  qr.props = {
    srcPath: 'documento.qrUrl',
    width: 120,
    height: 120,
    align: 'izquierda',
    tagId: 'qr',
    columna: 1,
  }

  const nota = createBlock('texto')
  nota.props = {
    content: 'Documento electrónico generado para demo BTW Template Studio.',
    columna: 1,
    contentStyleJson: stringifyTextStyle(defaultBodyStyle()),
  }

  const espacio = createBlock('espacio')

  return [
    header,
    autorizacion,
    top,
    espacio,
    tabla,
    totales,
    pago,
    software,
    qr,
    nota,
  ]
}

export function clampColumn(column: number, maxColumns: number): number {
  const safe = Number.isFinite(column) ? Math.trunc(column) : 1
  return Math.min(Math.max(safe, 1), Math.max(maxColumns, 1))
}

export function isChildAllowedInContainer(type: BlockType): boolean {
  return type !== 'contenedor'
}

/** Editor-only label for Datos blocks: "Cliente - Datos". Not rendered in PDF. */
export function datosPanelHeading(panelName: unknown): string {
  const name = String(panelName ?? '').trim()
  return name ? `${name} - Datos` : 'Datos'
}

export { stringifyTextStyle, parseTextStyleJson }

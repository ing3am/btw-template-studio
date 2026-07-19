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
import {
  DEFAULT_FONT_SIZE_LARGE_PX,
  DEFAULT_FONT_SIZE_SMALL_PX,
} from './pageSettings'
import { getDianLabel } from './dianLabels'

export type BlockType =
  | 'contenedor'
  | 'datos'
  | 'tabla'
  | 'texto'
  | 'espacio'
  | 'imagen'
  | 'qr'
  | 'salto'

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

function autorizacionFields(valueStyle?: Partial<TextStyle>): string {
  const vs = {
    ...defaultValueStyle(),
    fontSizePx: 7,
    bold: false,
    ...valueStyle,
  }
  const ls = { ...defaultLabelStyle(), fontSizePx: 7, bold: true }
  return stringifyDatosFields([
    fieldFromTag('doc-autorizacion', { labelStyle: ls, valueStyle: vs }),
    fieldFromTag('doc-prefijo', { labelStyle: ls, valueStyle: vs }),
    fieldFromTag('doc-rango-desde', { labelStyle: ls, valueStyle: vs }),
    fieldFromTag('doc-rango-hasta', { labelStyle: ls, valueStyle: vs }),
    fieldFromTag('doc-vigencia-inicio', { labelStyle: ls, valueStyle: vs }),
    fieldFromTag('doc-vigencia-fin', { labelStyle: ls, valueStyle: vs }),
  ])
}

function pagoFields(): string {
  return stringifyDatosFields([
    fieldFromTag('pago-forma'),
    fieldFromTag('pago-medio'),
    fieldFromTag('pago-plazo'),
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

/** Body col1 — SEÑORES (etiquetas DIAN + presentación FE) */
function senoresLeftFields(): string {
  const small = { ...defaultValueStyle(), fontSizePx: 8, bold: false }
  const label = { ...defaultLabelStyle(), fontSizePx: 8, bold: true }
  return stringifyDatosFields([
    fieldFromTag('cliente-nombre', {
      label: '',
      valueStyle: { ...small, fontSizePx: 9, bold: true },
    }),
    fieldFromTag('cliente-tipo-doc', {
      label: 'TIPO DE DOCUMENTO',
      labelStyle: label,
      valueStyle: small,
    }),
    fieldFromTag('cliente-nit', {
      label: 'NIT',
      labelStyle: label,
      valueStyle: small,
    }),
    fieldFromTag('cliente-telefono', {
      label: 'TELÉFONO',
      labelStyle: label,
      valueStyle: small,
    }),
  ])
}

/** Body col2 — dirección / ciudad / depto / país */
function senoresRightFields(): string {
  const small = { ...defaultValueStyle(), fontSizePx: 8, bold: false }
  const label = { ...defaultLabelStyle(), fontSizePx: 8, bold: true }
  return stringifyDatosFields([
    fieldFromTag('cliente-direccion', {
      label: 'DIRECCIÓN',
      labelStyle: label,
      valueStyle: small,
    }),
    fieldFromTag('cliente-ciudad', {
      label: 'CIUDAD',
      labelStyle: label,
      valueStyle: small,
    }),
    fieldFromTag('cliente-departamento', {
      label: 'DEPARTAMENTO',
      labelStyle: label,
      valueStyle: small,
    }),
    createDatosField({
      label: 'PAÍS',
      mode: 'campo',
      value: 'cliente.pais',
      labelStyle: label,
      valueStyle: small,
    }),
  ])
}

function totalesFields(): string {
  return stringifyDatosFields([
    fieldFromTag('totales-subtotal', { label: 'Subtotal' }),
    createDatosField({
      label: 'Descuento',
      mode: 'campo',
      value: 'totales.descuento',
      format: 'moneda',
    }),
    fieldFromTag('totales-iva'),
    fieldFromTag('totales-iva-tarifa'),
    fieldFromTag('totales-consumo', { label: 'INC' }),
    fieldFromTag('totales-consumo-tarifa'),
    createDatosField({
      label: 'Otros impuestos',
      mode: 'campo',
      value: 'totales.otrosImpuestos',
      format: 'moneda',
    }),
    createDatosField({
      label: 'Retenciones',
      mode: 'campo',
      value: 'totales.retenciones',
      format: 'moneda',
    }),
    fieldFromTag('totales-total', {
      label: 'Total COP',
      valueStyle: { ...defaultValueStyle(), fontSizePx: 11, bold: true },
    }),
  ])
}

function anexoCabeceraColumns(): string {
  const h = { ...defaultHeaderCellStyle(), fontSizePx: 8, align: 'centro' as const }
  const c = { ...defaultTableCellStyle(), fontSizePx: 8, align: 'centro' as const }
  return stringifyTableColumns([
    createTableColumn({ title: 'Factura', property: 'factura', headerStyle: h, cellStyle: c }),
    createTableColumn({
      title: 'Código prestador',
      property: 'codigoPrestador',
      headerStyle: h,
      cellStyle: c,
    }),
    createTableColumn({
      title: 'Fecha inicio',
      property: 'fechaInicio',
      headerStyle: h,
      cellStyle: c,
    }),
    createTableColumn({
      title: 'Fecha fin',
      property: 'fechaFin',
      headerStyle: h,
      cellStyle: c,
    }),
  ])
}

function anexoPacientesColumns(): string {
  const h = { ...defaultHeaderCellStyle(), fontSizePx: 7, align: 'centro' as const }
  const c = { ...defaultTableCellStyle(), fontSizePx: 7, align: 'centro' as const }
  return stringifyTableColumns([
    createTableColumn({ title: 'Tipo ID', property: 'tipoId', headerStyle: h, cellStyle: c }),
    createTableColumn({ title: '# ID', property: 'numeroId', headerStyle: h, cellStyle: c }),
    createTableColumn({
      title: 'Nombre paciente',
      property: 'nombre',
      headerStyle: h,
      cellStyle: c,
    }),
    createTableColumn({ title: 'Concepto', property: 'concepto', headerStyle: h, cellStyle: c }),
    createTableColumn({ title: 'Valor', property: 'valor', headerStyle: h, cellStyle: c }),
    createTableColumn({
      title: 'Autorización',
      property: 'autorizacion',
      headerStyle: h,
      cellStyle: c,
    }),
    createTableColumn({ title: 'Póliza', property: 'poliza', headerStyle: h, cellStyle: c }),
    createTableColumn({ title: 'Contrato', property: 'contrato', headerStyle: h, cellStyle: c }),
    createTableColumn({
      title: 'Fecha ingreso',
      property: 'fechaIngreso',
      headerStyle: h,
      cellStyle: c,
    }),
    createTableColumn({
      title: 'Fecha salida',
      property: 'fechaSalida',
      headerStyle: h,
      cellStyle: c,
    }),
  ])
}

function defaultTableColumns(): string {
  const numHeader = {
    ...defaultHeaderCellStyle(),
    fontSizePx: 10,
    align: 'derecha' as const,
  }
  const numCell = {
    ...defaultTableCellStyle(),
    fontSizePx: 10,
    align: 'derecha' as const,
  }
  const textHeader = { ...defaultHeaderCellStyle(), fontSizePx: 10 }
  const textCell = { ...defaultTableCellStyle(), fontSizePx: 10 }
  return stringifyTableColumns([
    createTableColumn({
      title: 'Línea',
      property: 'linea',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
    createTableColumn({
      title: 'Código',
      property: 'codigo',
      headerStyle: textHeader,
      cellStyle: textCell,
    }),
    createTableColumn({
      title: 'Descripción',
      property: 'descripcion',
      headerStyle: textHeader,
      cellStyle: textCell,
    }),
    createTableColumn({
      title: 'Cantidad',
      property: 'cantidad',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
    createTableColumn({
      title: 'Unidad',
      property: 'unidad',
      headerStyle: textHeader,
      cellStyle: textCell,
    }),
    createTableColumn({
      title: 'Valor Unitario',
      property: 'valorUnitario',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
    createTableColumn({
      title: 'Dcto',
      property: 'descuento',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
    createTableColumn({
      title: '%IVA',
      property: 'iva',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
    createTableColumn({
      title: 'Total',
      property: 'total',
      headerStyle: numHeader,
      cellStyle: numCell,
    }),
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
    description: 'Fila dinámica: cada hijo es una celda (anchos con slider)',
    defaults: {
      title: '',
      columnWidths: '',
      padding: 0,
      border: false,
      background: '#ffffff',
      titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
    },
  },
  {
    type: 'datos',
    label: 'Datos',
    description: 'Filas con texto o campos del JSON',
    defaults: {
      title: '',
      panelName: '',
      fieldsJson: stringifyDatosFields([
        createDatosField({ label: 'Campo', mode: 'texto', value: '' }),
      ]),
      cellAlign: 'izquierda',
      cellVAlign: 'arriba',
      boxBorder: false,
      boxRadius: 0,
      boxPadding: 0,
      boxBorderColor: '#888888',
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
      cellAlign: 'izquierda',
      cellVAlign: 'arriba',
      boxBorder: false,
      boxRadius: 0,
      boxPadding: 0,
      boxBorderColor: '#888888',
    },
  },
  {
    type: 'texto',
    label: 'Texto',
    description: 'Nota o párrafo libre',
    defaults: {
      content: 'Texto de ejemplo',
      cellAlign: 'izquierda',
      cellVAlign: 'arriba',
      boxBorder: false,
      boxRadius: 0,
      boxPadding: 0,
      boxBorderColor: '#888888',
      contentStyleJson: stringifyTextStyle(defaultBodyStyle()),
    },
  },
  {
    type: 'espacio',
    label: 'Espacio',
    description: 'Separación vertical',
    defaults: {
      size: 16,
      cellAlign: 'izquierda',
      cellVAlign: 'arriba',
    },
  },
  {
    type: 'salto',
    label: 'Nueva página',
    description: 'Salto de página con orientación (vertical/horizontal)',
    defaults: {
      orientation: 'horizontal',
    },
  },
  {
    type: 'imagen',
    label: 'Imagen',
    description: 'Logo u otra imagen subida o desde un campo JSON',
    defaults: {
      sourceMode: 'upload',
      assetId: '',
      srcPath: '',
      width: 120,
      height: 120,
      align: 'centro',
      cellAlign: 'centro',
      cellVAlign: 'centro',
      columna: 1,
    },
  },
  {
    type: 'qr',
    label: 'Código QR',
    description: 'QR DIAN desde la URL del UBL u otro campo',
    defaults: {
      sourceMode: 'dian',
      srcPath: 'documento.qrUrl',
      staticUrl: '',
      tagId: 'qr',
      width: 80,
      height: 80,
      align: 'centro',
      cellAlign: 'centro',
      cellVAlign: 'centro',
      columna: 1,
    },
  },
]

export function createBlock(
  type: BlockType,
  options?: { defaultFontSizePx?: number },
): TemplateBlock {
  const catalog = BLOCK_CATALOG.find((item) => item.type === type)
  const block: TemplateBlock = {
    id: crypto.randomUUID(),
    type,
    props: { ...(catalog?.defaults ?? {}) },
  }
  if (type === 'contenedor') {
    block.children = []
  }
  const fontSizePx = options?.defaultFontSizePx
  if (typeof fontSizePx === 'number' && fontSizePx > 0) {
    applyDefaultFontSizeToNewBlock(block, fontSizePx)
  }
  return block
}

function applyDefaultFontSizeToNewBlock(
  block: TemplateBlock,
  fontSizePx: number,
): void {
  if (typeof block.props.titleStyleJson === 'string') {
    const style = parseTextStyleJson(block.props.titleStyleJson, defaultTitleStyle())
    block.props.titleStyleJson = stringifyTextStyle({ ...style, fontSizePx })
  }
  if (typeof block.props.contentStyleJson === 'string') {
    const style = parseTextStyleJson(block.props.contentStyleJson, defaultBodyStyle())
    block.props.contentStyleJson = stringifyTextStyle({ ...style, fontSizePx })
  }
  if (typeof block.props.fieldsJson === 'string') {
    const fields = parseDatosFields(block.props.fieldsJson)
    block.props.fieldsJson = stringifyDatosFields(
      fields.map((field) => ({
        ...field,
        labelStyle: { ...field.labelStyle, fontSizePx },
        valueStyle: { ...field.valueStyle, fontSizePx },
      })),
    )
  }
  if (typeof block.props.columnsJson === 'string') {
    const columns = parseTableColumns(block.props.columnsJson)
    block.props.columnsJson = stringifyTableColumns(
      columns.map((column) => ({
        ...column,
        headerStyle: { ...column.headerStyle, fontSizePx },
        cellStyle: { ...column.cellStyle, fontSizePx },
      })),
    )
  }
}

export function createDefaultFacturaBlocks(options?: {
  sectorSalud?: boolean
  defaultFontSizeLarge?: number
  defaultFontSizeSmall?: number
}): TemplateBlock[] {
  // Replica estructural de FacturaFormatoSeisAmazonas (orden document.Add):
  // Header {20,30,20} → Body {2,2,1.5,2} → Body2 {2,2,3.5} → CUFE → ítems →
  // UnitTotal → Footer {4,2} → valor letras → pie FE (+ anexo salud opcional)

  const sectorSalud = options?.sectorSalud ?? false
  const large =
    typeof options?.defaultFontSizeLarge === 'number' &&
    options.defaultFontSizeLarge > 0
      ? options.defaultFontSizeLarge
      : DEFAULT_FONT_SIZE_LARGE_PX
  const small =
    typeof options?.defaultFontSizeSmall === 'number' &&
    options.defaultFontSizeSmall > 0
      ? options.defaultFontSizeSmall
      : DEFAULT_FONT_SIZE_SMALL_PX
  const small9 = { ...defaultValueStyle(), fontSizePx: large, bold: false }
  const small8 = { ...defaultValueStyle(), fontSizePx: small, bold: false }
  const title10 = {
    ...defaultTitleStyle(),
    color: '#111111',
    fontSizePx: Math.max(large, 10),
  }

  // —— Header {20, 30, 20}: logo | empresa | tipo+LegalNumber ——
  const logo = createBlock('imagen')
  logo.props = {
    sourceMode: 'upload',
    assetId: '',
    srcPath: '',
    width: 90,
    height: 90,
    align: 'centro',
    cellAlign: 'centro',
    cellVAlign: 'centro',
  }

  const empresa = createBlock('datos')
  empresa.props = {
    title: '',
    panelName: 'Razón social del vendedor',
    sourceTagId: 'emisor-razon',
    cellAlign: 'centro',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      fieldFromTag('emisor-razon', {
        label: '',
        valueStyle: {
          ...defaultValueStyle(),
          fontSizePx: 10,
          bold: true,
          align: 'centro',
        },
      }),
      fieldFromTag('emisor-nit', {
        label: 'NIT',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: large, bold: true },
        valueStyle: { ...small9, align: 'centro' },
      }),
      fieldFromTag('emisor-responsabilidad', {
        label: '',
        valueStyle: { ...small8, align: 'centro', fontSizePx: 7 },
      }),
      fieldFromTag('emisor-telefono', {
        label: 'TEL',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: large, bold: true },
        valueStyle: { ...small9, align: 'centro' },
      }),
      fieldFromTag('emisor-direccion', {
        label: '',
        valueStyle: { ...small9, align: 'centro' },
      }),
      fieldFromTag('emisor-email', {
        label: '',
        valueStyle: { ...small9, align: 'centro' },
      }),
    ]),
    labelWidth: 40,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  // Tipo de documento + número = etiquetas DIAN (doc-tipo / doc-numero), no texto quemado
  const legalNum = createBlock('datos')
  legalNum.props = {
    title: '',
    panelName: 'Tipo de documento',
    sourceTagId: 'doc-tipo',
    cellAlign: 'centro',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      fieldFromTag('doc-tipo', {
        label: '',
        valueStyle: {
          ...defaultValueStyle(),
          fontSizePx: large,
          bold: true,
          align: 'centro',
        },
      }),
      fieldFromTag('doc-numero', {
        label: '',
        valueStyle: {
          ...defaultValueStyle(),
          fontSizePx: 11,
          bold: true,
          align: 'centro',
        },
      }),
    ]),
    labelWidth: 40,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const header = createBlock('contenedor')
  header.props = {
    title: '',
    columnWidths: '20,30,20',
    padding: 2,
    border: false,
    background: '#ffffff',
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  header.children = [logo, empresa, legalNum]

  // —— Body {2, 2, 1.5, 2}: SEÑORES | dirección | fechas | QR ——
  const senores1 = createBlock('datos')
  senores1.props = {
    title: 'SEÑORES',
    panelName: 'Cliente',
    cellAlign: 'izquierda',
    presentation: 'stack',
    boxBorder: true,
    boxRadius: 8,
    boxPadding: 6,
    boxBorderColor: '#888888',
    fieldsJson: senoresLeftFields(),
    labelWidth: 120,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(title10),
  }

  const senores2 = createBlock('datos')
  senores2.props = {
    title: '',
    panelName: 'Dirección',
    cellAlign: 'izquierda',
    presentation: 'stack',
    boxBorder: true,
    boxRadius: 8,
    boxPadding: 6,
    boxBorderColor: '#888888',
    fieldsJson: senoresRightFields(),
    labelWidth: 120,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(title10),
  }

  const fechas = createBlock('datos')
  fechas.props = {
    title: '',
    panelName: 'Fechas',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      fieldFromTag('doc-fecha-generacion', {
        label: 'Fecha de generación',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      fieldFromTag('doc-hora-generacion', {
        label: 'Hora de generación',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      createDatosField({
        label: 'Fecha Validación Dian',
        mode: 'campo',
        value: 'factura.fechaValidacionDian',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
    ]),
    labelWidth: 120,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const qr = createBlock('qr')
  qr.props = {
    sourceMode: 'dian',
    srcPath: 'documento.qrUrl',
    tagId: 'qr',
    width: 80,
    height: 80,
    align: 'centro',
    cellAlign: 'centro',
    cellVAlign: 'centro',
  }

  const body = createBlock('contenedor')
  body.props = {
    title: '',
    columnWidths: '2,2,1.5,2',
    padding: 0,
    border: false,
    background: '#ffffff',
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  body.children = [senores1, senores2, fechas, qr]

  // —— Body2 {2, 2, 3.5}: info factura | pedido | resolución ——
  const infoFactura = createBlock('datos')
  infoFactura.props = {
    title: 'INFORMACIÓN FACTURA',
    panelName: 'Información factura',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      createDatosField({
        label: 'Fecha Factura',
        mode: 'campo',
        value: 'factura.fecha',
        format: 'fecha',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      createDatosField({
        label: 'Fecha Vencimiento',
        mode: 'campo',
        value: 'factura.fechaVencimiento',
        format: 'fecha',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      fieldFromTag('pago-forma', {
        label: 'Forma de Pago',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      fieldFromTag('pago-medio', {
        label: 'Medio de Pago',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
    ]),
    labelWidth: 110,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(title10),
  }

  const infoPedido = createBlock('datos')
  infoPedido.props = {
    title: '',
    panelName: 'Pedido',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      createDatosField({
        label: 'Nro Pedido',
        mode: 'campo',
        value: 'factura.nroPedido',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
      createDatosField({
        label: 'Línea de negocio',
        mode: 'campo',
        value: 'factura.lineaNegocio',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: small, bold: true },
        valueStyle: small8,
      }),
    ]),
    labelWidth: 110,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const resolucion = createBlock('datos')
  resolucion.props = {
    title: '',
    panelName: 'Autorización DIAN',
    sourceTagId: 'doc-autorizacion',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: autorizacionFields(),
    labelWidth: 130,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const body2 = createBlock('contenedor')
  body2.props = {
    title: '',
    columnWidths: '2,2,3.5',
    padding: 0,
    border: false,
    background: '#ffffff',
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  body2.children = [infoFactura, infoPedido, resolucion]

  // —— CUFE fila completa ——
  const cufe = createBlock('datos')
  cufe.props = {
    title: '',
    panelName: 'CUFE',
    sourceTagId: 'cufe',
    cellAlign: 'izquierda',
    presentation: 'fiscal',
    fieldsJson: stringifyDatosFields([
      fieldFromTag('cufe', {
        label: 'CUFE',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: large, bold: true },
        valueStyle: { ...defaultValueStyle(), fontSizePx: 7, bold: false },
      }),
    ]),
    labelWidth: 40,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(title10),
  }

  // —— Ítems 9 cols ——
  const tabla = createBlock('tabla')
  tabla.props = {
    arrayPath: 'items',
    columnsJson: defaultTableColumns(),
    cellAlign: 'izquierda',
  }

  const totalItems = createBlock('datos')
  totalItems.props = {
    title: '',
    panelName: 'Total items',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      createDatosField({
        label: 'Total Items',
        mode: 'campo',
        value: 'totales.totalItems',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: large, bold: true },
        valueStyle: { ...defaultValueStyle(), fontSizePx: large, bold: true },
      }),
    ]),
    labelWidth: 80,
    labelValueGap: 4,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  // —— Footer {4, 2}: observaciones | totales ——
  const observaciones = createBlock('datos')
  observaciones.props = {
    title: 'OBSERVACIONES',
    panelName: 'Observaciones',
    cellAlign: 'izquierda',
    presentation: 'stack',
    boxBorder: true,
    boxRadius: 8,
    boxPadding: 6,
    boxBorderColor: '#888888',
    fieldsJson: stringifyDatosFields([
      createDatosField({
        label: '',
        mode: 'campo',
        value: 'observaciones',
        valueStyle: small8,
      }),
    ]),
    labelWidth: 40,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle({
      ...defaultTitleStyle(),
      color: '#111111',
      fontSizePx: large,
    }),
  }

  const totales = createBlock('datos')
  totales.props = {
    title: '',
    panelName: 'Totales',
    cellAlign: 'derecha',
    presentation: 'totales',
    fieldsJson: totalesFields(),
    labelWidth: 110,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const footer = createBlock('contenedor')
  footer.props = {
    title: '',
    columnWidths: '4,2',
    padding: 0,
    border: false,
    background: '#ffffff',
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }
  footer.children = [observaciones, totales]

  const valorLetras = createBlock('datos')
  valorLetras.props = {
    title: '',
    panelName: 'Valor en letras',
    cellAlign: 'izquierda',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      createDatosField({
        label: 'SON',
        mode: 'campo',
        value: 'totales.valorEnLetras',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: large, bold: true },
        valueStyle: { ...small9, bold: true },
      }),
    ]),
    labelWidth: 40,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  const pie = createBlock('datos')
  pie.props = {
    title: '',
    panelName: 'Software / PT',
    sourceTagId: 'software-fabricante',
    cellAlign: 'centro',
    presentation: 'stack',
    fieldsJson: stringifyDatosFields([
      fieldFromTag('software-fabricante', {
        label: 'Fabricante del software',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: 7, bold: true },
        valueStyle: { ...small8, fontSizePx: 7, align: 'centro' },
      }),
      fieldFromTag('software-fabricante-nit', {
        label: 'NIT fabricante',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: 7, bold: true },
        valueStyle: { ...small8, fontSizePx: 7, align: 'centro' },
      }),
      fieldFromTag('software-nombre', {
        label: 'Software',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: 7, bold: true },
        valueStyle: { ...small8, fontSizePx: 7, align: 'centro' },
      }),
      fieldFromTag('software-proveedor', {
        label: 'Proveedor tecnológico',
        labelStyle: { ...defaultLabelStyle(), fontSizePx: 7, bold: true },
        valueStyle: { ...small8, fontSizePx: 7, align: 'centro' },
      }),
    ]),
    labelWidth: 140,
    labelValueGap: 2,
    titleStyleJson: stringifyTextStyle(defaultTitleStyle()),
  }

  // Como FE: NewPage + landscape → anexo salud en tablas
  const saltoAnexo = createBlock('salto')
  saltoAnexo.props = { orientation: 'horizontal' }

  const anexoTitulo = createBlock('texto')
  anexoTitulo.props = {
    content: 'Anexo para sector salud',
    cellAlign: 'izquierda',
    contentStyleJson: stringifyTextStyle({
      ...defaultTitleStyle(),
      fontSizePx: 10,
      bold: true,
    }),
  }

  const anexoCabecera = createBlock('tabla')
  anexoCabecera.props = {
    arrayPath: 'anexoSalud.cabecera',
    columnsJson: anexoCabeceraColumns(),
    cellAlign: 'izquierda',
    cellVAlign: 'arriba',
    boxBorder: false,
    boxRadius: 0,
    boxPadding: 0,
  }

  const anexoPacientes = createBlock('tabla')
  anexoPacientes.props = {
    arrayPath: 'anexoSalud.pacientes',
    columnsJson: anexoPacientesColumns(),
    cellAlign: 'izquierda',
    cellVAlign: 'arriba',
    boxBorder: false,
    boxRadius: 0,
    boxPadding: 0,
  }

  const gap = (size: number) => {
    const e = createBlock('espacio')
    e.props = { size, cellAlign: 'izquierda' }
    return e
  }

  const base: TemplateBlock[] = [
    header,
    gap(8),
    body,
    body2,
    cufe,
    gap(6),
    tabla,
    totalItems,
    gap(6),
    footer,
    gap(4),
    valorLetras,
    pie,
  ]

  if (!sectorSalud) return base

  return [
    ...base,
    saltoAnexo,
    anexoTitulo,
    gap(4),
    anexoCabecera,
    gap(4),
    anexoPacientes,
  ]
}

export function clampColumn(column: number, maxColumns: number): number {
  const safe = Number.isFinite(column) ? Math.trunc(column) : 1
  return Math.min(Math.max(safe, 1), Math.max(maxColumns, 1))
}

export function isChildAllowedInContainer(type: BlockType): boolean {
  return type !== 'contenedor' && type !== 'salto'
}

/** Editor-only label for Datos blocks. Etiquetas DIAN keep their catalog name. */
export function datosPanelHeading(
  panelName: unknown,
  options?: { fromEtiqueta?: boolean },
): string {
  const name = String(panelName ?? '').trim()
  if (options?.fromEtiqueta) {
    return name ? `Etiqueta · ${name}` : 'Etiqueta DIAN'
  }
  return name ? `${name} - Datos` : 'Datos'
}

export {
  fieldFromTag,
  clienteFields,
  emisorFields,
  headerFields,
  autorizacionFields,
  pagoFields,
  softwareFields,
  stringifyTextStyle,
  parseTextStyleJson,
}

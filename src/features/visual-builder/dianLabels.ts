import type { DatosFormat } from './types'

export type DianLabelKind = 'field' | 'image'

export type DianLabel = {
  id: string
  label: string
  path: string
  kind: DianLabelKind
  format: DatosFormat
  /** Required on graphical representation (Res. 000165) */
  required: boolean
}

/** Catalog aligned to UBL sample + DIAN graphical requirements. */
export const DIAN_LABELS: DianLabel[] = [
  // Documento
  {
    id: 'doc-tipo',
    label: 'Tipo de documento',
    path: 'documento.tipo',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-numero',
    label: 'Número de factura',
    path: 'documento.numero',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-prefijo',
    label: 'Prefijo',
    path: 'documento.prefijo',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-autorizacion',
    label: 'Autorización DIAN',
    path: 'documento.autorizacion',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-rango-desde',
    label: 'Rango autorizado desde',
    path: 'documento.rangoDesde',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-rango-hasta',
    label: 'Rango autorizado hasta',
    path: 'documento.rangoHasta',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-vigencia-inicio',
    label: 'Vigencia numeración desde',
    path: 'documento.vigenciaInicio',
    kind: 'field',
    format: 'fecha',
    required: true,
  },
  {
    id: 'doc-vigencia-fin',
    label: 'Vigencia numeración hasta',
    path: 'documento.vigenciaFin',
    kind: 'field',
    format: 'fecha',
    required: true,
  },
  {
    id: 'doc-fecha-generacion',
    label: 'Fecha de generación',
    path: 'documento.fechaGeneracion',
    kind: 'field',
    format: 'fecha',
    required: true,
  },
  {
    id: 'doc-hora-generacion',
    label: 'Hora de generación',
    path: 'documento.horaGeneracion',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'doc-fecha-vencimiento',
    label: 'Fecha de vencimiento',
    path: 'documento.fechaVencimiento',
    kind: 'field',
    format: 'fecha',
    required: false,
  },
  {
    id: 'doc-moneda',
    label: 'Moneda',
    path: 'documento.moneda',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cufe',
    label: 'CUFE',
    path: 'documento.cufe',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'qr',
    label: 'Código QR',
    path: 'documento.qrUrl',
    kind: 'image',
    format: 'ninguno',
    required: true,
  },

  // Emisor
  {
    id: 'emisor-razon',
    label: 'Razón social del vendedor',
    path: 'emisor.razonSocial',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'emisor-nit',
    label: 'NIT del vendedor',
    path: 'emisor.nit',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'emisor-dv',
    label: 'DV del vendedor',
    path: 'emisor.dv',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-direccion',
    label: 'Dirección del vendedor',
    path: 'emisor.direccion',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-ciudad',
    label: 'Ciudad del vendedor',
    path: 'emisor.ciudad',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-departamento',
    label: 'Departamento del vendedor',
    path: 'emisor.departamento',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-telefono',
    label: 'Teléfono del vendedor',
    path: 'emisor.telefono',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-email',
    label: 'Email del vendedor',
    path: 'emisor.email',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'emisor-responsabilidad',
    label: 'Calidad tributaria del vendedor',
    path: 'emisor.responsabilidad',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },

  // Adquirente
  {
    id: 'cliente-nombre',
    label: 'Nombre o razón social del comprador',
    path: 'cliente.nombre',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'cliente-nit',
    label: 'NIT o documento del comprador',
    path: 'cliente.nit',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'cliente-tipo-doc',
    label: 'Tipo de documento del comprador',
    path: 'cliente.tipoDocumento',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-direccion',
    label: 'Dirección del comprador',
    path: 'cliente.direccion',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-ciudad',
    label: 'Ciudad del comprador',
    path: 'cliente.ciudad',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-departamento',
    label: 'Departamento del comprador',
    path: 'cliente.departamento',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-telefono',
    label: 'Teléfono del comprador',
    path: 'cliente.telefono',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-email',
    label: 'Email del comprador',
    path: 'cliente.email',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'cliente-pais',
    label: 'País del comprador',
    path: 'cliente.pais',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },

  // Factura (mirror block from UBL mapper)
  {
    id: 'factura-fecha',
    label: 'Fecha de factura',
    path: 'factura.fecha',
    kind: 'field',
    format: 'fecha',
    required: false,
  },
  {
    id: 'factura-fecha-vencimiento',
    label: 'Fecha vencimiento factura',
    path: 'factura.fechaVencimiento',
    kind: 'field',
    format: 'fecha',
    required: false,
  },
  {
    id: 'factura-forma-pago',
    label: 'Forma de pago (factura)',
    path: 'factura.formaPago',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'factura-medio-pago',
    label: 'Medio de pago (factura)',
    path: 'factura.medioPago',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'factura-nro-pedido',
    label: 'Número de pedido',
    path: 'factura.nroPedido',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'factura-linea-negocio',
    label: 'Línea de negocio',
    path: 'factura.lineaNegocio',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'factura-fecha-validacion-dian',
    label: 'Fecha validación DIAN',
    path: 'factura.fechaValidacionDian',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'factura-fecha-generacion-erp',
    label: 'Fecha generación ERP',
    path: 'factura.fechaGeneracionErp',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },

  // Fiscal
  {
    id: 'fiscal-autorizacion',
    label: 'Autorización (fiscal)',
    path: 'fiscal.autorizacion',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-prefijo',
    label: 'Prefijo (fiscal)',
    path: 'fiscal.prefijo',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-rango-desde',
    label: 'Rango desde (fiscal)',
    path: 'fiscal.rangoDesde',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-rango-hasta',
    label: 'Rango hasta (fiscal)',
    path: 'fiscal.rangoHasta',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-resolucion',
    label: 'Resolución DIAN',
    path: 'fiscal.resolucion',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-cufe',
    label: 'CUFE (fiscal)',
    path: 'fiscal.cufe',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'fiscal-qr-url',
    label: 'URL QR (fiscal)',
    path: 'fiscal.qrUrl',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },

  // Observaciones
  {
    id: 'observaciones',
    label: 'Observaciones',
    path: 'observaciones',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },

  // Pago
  {
    id: 'pago-forma',
    label: 'Forma de pago',
    path: 'pago.forma',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'pago-medio',
    label: 'Medio de pago',
    path: 'pago.medio',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'pago-plazo',
    label: 'Plazo de pago',
    path: 'pago.plazo',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'pago-fecha-vencimiento',
    label: 'Fecha límite de pago',
    path: 'pago.fechaVencimiento',
    kind: 'field',
    format: 'fecha',
    required: false,
  },

  // Totales / impuestos
  {
    id: 'totales-subtotal1',
    label: 'Subtotal 1',
    path: 'totales.subtotal1',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-descuento',
    label: 'Descuento total',
    path: 'totales.descuento',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-subtotal2',
    label: 'Subtotal 2',
    path: 'totales.subtotal2',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-subtotal',
    label: 'Subtotal',
    path: 'totales.subtotal',
    kind: 'field',
    format: 'moneda',
    required: true,
  },
  {
    id: 'totales-iva',
    label: 'IVA',
    path: 'totales.iva',
    kind: 'field',
    format: 'moneda',
    required: true,
  },
  {
    id: 'totales-iva-tarifa',
    label: 'Tarifa IVA',
    path: 'totales.ivaTarifa',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'totales-inc',
    label: 'INC',
    path: 'totales.inc',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-consumo',
    label: 'Impuesto al consumo',
    path: 'totales.impuestoConsumo',
    kind: 'field',
    format: 'moneda',
    required: true,
  },
  {
    id: 'totales-consumo-tarifa',
    label: 'Tarifa impuesto al consumo',
    path: 'totales.impuestoConsumoTarifa',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'totales-otros',
    label: 'Otros impuestos',
    path: 'totales.otrosImpuestos',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-retenciones',
    label: 'Retenciones',
    path: 'totales.retenciones',
    kind: 'field',
    format: 'moneda',
    required: false,
  },
  {
    id: 'totales-total',
    label: 'Valor total de la operación',
    path: 'totales.total',
    kind: 'field',
    format: 'moneda',
    required: true,
  },
  {
    id: 'totales-total-items',
    label: 'Total ítems',
    path: 'totales.totalItems',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },
  {
    id: 'totales-valor-en-letras',
    label: 'Valor en letras',
    path: 'totales.valorEnLetras',
    kind: 'field',
    format: 'ninguno',
    required: false,
  },

  // Software / PT
  {
    id: 'software-fabricante',
    label: 'Fabricante del software',
    path: 'software.fabricante',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'software-fabricante-nit',
    label: 'NIT del fabricante del software',
    path: 'software.fabricanteNit',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'software-nombre',
    label: 'Nombre del software',
    path: 'software.nombre',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
  {
    id: 'software-proveedor',
    label: 'Proveedor tecnológico',
    path: 'software.proveedor',
    kind: 'field',
    format: 'ninguno',
    required: true,
  },
]

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function filterDianLabels(query: string): DianLabel[] {
  const q = normalizeSearch(query)
  if (!q) return DIAN_LABELS
  return DIAN_LABELS.filter(
    (item) =>
      normalizeSearch(item.label).includes(q) ||
      normalizeSearch(item.path).includes(q),
  )
}

export function getDianLabel(id: string): DianLabel | undefined {
  return DIAN_LABELS.find((item) => item.id === id)
}

export function requiredDianLabels(): DianLabel[] {
  return DIAN_LABELS.filter((item) => item.required)
}

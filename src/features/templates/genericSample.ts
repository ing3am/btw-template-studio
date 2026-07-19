/**
 * Editor DEMO sample aligned with backend InvoiceViewModel shape
 * (`DianUblToViewModelMapper`: documento.*, factura.*, fiscal.*, items[], …).
 * Keeps empresa/cliente DEMO values; adds the extra mapper fields for Avanzado.
 */

export type CompanySampleOverride = {
  razonSocial?: string
  nit?: string
  dv?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  departamento?: string
  email?: string
  responsabilidad?: string
}

const SAMPLE_CUFE =
  '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

function buildQrUrl(cufe: string): string {
  return `https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=${cufe}`
}

export { SAMPLE_CUFE }

export function buildGenericEditorSample(options?: {
  company?: CompanySampleOverride
  sectorSalud?: boolean
}): Record<string, unknown> {
  const company = options?.company ?? {}
  const sectorSalud = options?.sectorSalud ?? false
  const cufe = SAMPLE_CUFE
  const qrUrl = buildQrUrl(cufe)
  const numero = 'DEMO-1'

  const emisor = {
    razonSocial: company.razonSocial ?? 'EMPRESA DEMO S.A.S.',
    nit: company.nit ?? '900000000-1',
    dv: company.dv ?? '1',
    telefono: company.telefono ?? '6040000000',
    direccion: company.direccion ?? 'Calle 1 # 2-3',
    ciudad: company.ciudad ?? 'Medellín',
    departamento: company.departamento ?? 'Antioquia',
    email: company.email ?? 'facturacion@empresa-demo.co',
    responsabilidad: company.responsabilidad ?? 'No responsable de IVA',
  }

  const sample: Record<string, unknown> = {
    numero,
    documento: {
      tipo: 'FACTURA ELECTRÓNICA DE VENTA',
      numero,
      prefijo: 'DEMO',
      autorizacion: '00000000000000',
      rangoDesde: '1',
      rangoHasta: '1000',
      vigenciaInicio: '2026-01-01',
      vigenciaFin: '2026-12-31',
      fechaGeneracion: '2026-07-18',
      horaGeneracion: '12:00:00-05:00',
      fechaVencimiento: '2026-08-17',
      moneda: 'COP',
      cufe,
      qrUrl,
    },
    emisor,
    cliente: {
      nombre: 'CLIENTE DE EJEMPLO S.A.S.',
      tipoDocumento: 'NIT',
      nit: '800000000-1',
      telefono: '3000000000',
      direccion: 'Carrera 10 # 20-30',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      pais: 'COLOMBIA',
      email: 'cliente@ejemplo.co',
    },
    factura: {
      fecha: '2026-07-18',
      fechaVencimiento: '2026-08-17',
      formaPago: 'Plazo 30 DÍAS',
      medioPago: 'Transferencia Débito Bancaria',
      nroPedido: 'PED-001',
      lineaNegocio: 'Servicios de ejemplo',
      fechaValidacionDian: '2026-07-18 12:00:10',
      fechaGeneracionErp: '2026-07-18 12:00:00',
    },
    fiscal: {
      autorizacion: '00000000000000',
      prefijo: 'DEMO',
      rangoDesde: '1',
      rangoHasta: '1000',
      resolucion: 'Resolución de ejemplo Prefijo DEMO desde 1 hasta 1000',
      cufe,
      qrUrl,
    },
    pago: {
      forma: 'Crédito',
      medio: 'Transferencia Débito Bancaria',
      plazo: '30 días',
      fechaVencimiento: '2026-08-17',
    },
    observaciones: 'Documento de ejemplo para diseño de plantilla.',
    items: [
      {
        linea: 1,
        codigo: 'SRV001',
        descripcion: 'Servicio de ejemplo A',
        cantidad: 1,
        unidad: 'UND',
        valorUnitario: 100000,
        descuento: 0,
        iva: 0,
        total: 100000,
        valor: 100000,
      },
      {
        linea: 2,
        codigo: 'SRV002',
        descripcion: 'Servicio de ejemplo B',
        cantidad: 2,
        unidad: 'UND',
        valorUnitario: 25000,
        descuento: 0,
        iva: 0,
        total: 50000,
        valor: 50000,
      },
    ],
    totales: {
      subtotal1: 150000,
      descuento: 0,
      subtotal2: 150000,
      subtotal: 150000,
      iva: 0,
      ivaTarifa: '0%',
      inc: 0,
      impuestoConsumo: 0,
      impuestoConsumoTarifa: '0%',
      otrosImpuestos: 0,
      retenciones: 0,
      total: 150000,
      totalItems: 3,
      valorEnLetras: 'CIENTO CINCUENTA MIL PESOS',
    },
    software: {
      fabricante: 'Bythewave S.A.S.',
      fabricanteNit: '900665411',
      nombre: 'BTW Facturación Electrónica',
      proveedor: 'Bythewave S.A.S.',
    },
  }

  if (sectorSalud) {
    sample.anexoSalud = {
      cabecera: [
        {
          factura: '1',
          codigoPrestador: '000000000000',
          fechaInicio: '2026-07-01',
          fechaFin: '2026-07-18',
        },
      ],
      pacientes: [
        {
          tipoId: 'CC',
          numeroId: '1000000000',
          nombre: 'PACIENTE EJEMPLO',
          concepto: 'CONSULTA',
          valor: '150000',
          autorizacion: '0',
          poliza: '',
          contrato: '',
          fechaIngreso: '2026-07-01',
          fechaSalida: '2026-07-01',
        },
      ],
    }
  }

  return sample
}

/** Pretty-printed DEMO for Avanzado / mocks. */
export function buildGenericEditorSampleJson(options?: {
  company?: CompanySampleOverride
  sectorSalud?: boolean
}): string {
  return JSON.stringify(buildGenericEditorSample(options), null, 2)
}

/**
 * Lightweight JSON Schema describing InvoiceViewModel roots
 * (aligned with DianUblToViewModelMapper output).
 */
export const GENERIC_EDITOR_SCHEMA = `{
  "type": "object",
  "title": "InvoiceViewModel",
  "description": "Shape produced by Btw.TemplatePdf DianUblToViewModelMapper (and studio DEMO).",
  "required": [
    "documento",
    "emisor",
    "cliente",
    "factura",
    "fiscal",
    "pago",
    "items",
    "totales",
    "software"
  ],
  "properties": {
    "numero": { "type": "string" },
    "documento": {
      "type": "object",
      "required": ["tipo", "numero", "cufe", "qrUrl", "moneda"],
      "properties": {
        "tipo": { "type": "string" },
        "numero": { "type": "string" },
        "prefijo": { "type": "string" },
        "autorizacion": { "type": "string" },
        "rangoDesde": { "type": "string" },
        "rangoHasta": { "type": "string" },
        "vigenciaInicio": { "type": "string" },
        "vigenciaFin": { "type": "string" },
        "fechaGeneracion": { "type": "string" },
        "horaGeneracion": { "type": "string" },
        "fechaVencimiento": { "type": "string" },
        "moneda": { "type": "string" },
        "cufe": { "type": "string" },
        "qrUrl": { "type": "string" }
      }
    },
    "emisor": {
      "type": "object",
      "required": ["razonSocial", "nit"],
      "properties": {
        "razonSocial": { "type": "string" },
        "nit": { "type": "string" },
        "dv": { "type": "string" },
        "direccion": { "type": "string" },
        "ciudad": { "type": "string" },
        "departamento": { "type": "string" },
        "telefono": { "type": "string" },
        "email": { "type": "string" },
        "responsabilidad": { "type": "string" }
      }
    },
    "cliente": {
      "type": "object",
      "required": ["nombre", "nit"],
      "properties": {
        "nombre": { "type": "string" },
        "tipoDocumento": { "type": "string" },
        "nit": { "type": "string" },
        "direccion": { "type": "string" },
        "ciudad": { "type": "string" },
        "departamento": { "type": "string" },
        "pais": { "type": "string" },
        "telefono": { "type": "string" },
        "email": { "type": "string" }
      }
    },
    "factura": {
      "type": "object",
      "properties": {
        "fecha": { "type": "string" },
        "fechaVencimiento": { "type": "string" },
        "formaPago": { "type": "string" },
        "medioPago": { "type": "string" },
        "nroPedido": { "type": "string" },
        "lineaNegocio": { "type": "string" },
        "fechaValidacionDian": { "type": "string" },
        "fechaGeneracionErp": { "type": "string" }
      }
    },
    "fiscal": {
      "type": "object",
      "properties": {
        "autorizacion": { "type": "string" },
        "prefijo": { "type": "string" },
        "rangoDesde": { "type": "string" },
        "rangoHasta": { "type": "string" },
        "resolucion": { "type": "string" },
        "cufe": { "type": "string" },
        "qrUrl": { "type": "string" }
      }
    },
    "pago": {
      "type": "object",
      "properties": {
        "forma": { "type": "string" },
        "medio": { "type": "string" },
        "plazo": { "type": "string" },
        "fechaVencimiento": { "type": "string" }
      }
    },
    "observaciones": { "type": "string" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["descripcion", "cantidad", "total"],
        "properties": {
          "linea": { "type": "number" },
          "codigo": { "type": "string" },
          "descripcion": { "type": "string" },
          "cantidad": { "type": "number" },
          "unidad": { "type": "string" },
          "valorUnitario": { "type": "number" },
          "descuento": { "type": "number" },
          "iva": { "type": "number" },
          "total": { "type": "number" },
          "valor": { "type": "number" }
        }
      }
    },
    "totales": {
      "type": "object",
      "required": ["subtotal", "total"],
      "properties": {
        "subtotal1": { "type": "number" },
        "descuento": { "type": "number" },
        "subtotal2": { "type": "number" },
        "subtotal": { "type": "number" },
        "iva": { "type": "number" },
        "ivaTarifa": { "type": "string" },
        "inc": { "type": "number" },
        "impuestoConsumo": { "type": "number" },
        "impuestoConsumoTarifa": { "type": "string" },
        "otrosImpuestos": { "type": "number" },
        "retenciones": { "type": "number" },
        "total": { "type": "number" },
        "totalItems": { "type": "number" },
        "valorEnLetras": { "type": "string" }
      }
    },
    "software": {
      "type": "object",
      "properties": {
        "fabricante": { "type": "string" },
        "fabricanteNit": { "type": "string" },
        "nombre": { "type": "string" },
        "proveedor": { "type": "string" }
      }
    },
    "anexoSalud": { "type": "object" }
  }
}`

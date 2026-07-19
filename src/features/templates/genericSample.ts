/**
 * Editor DEMO sample aligned with backend InvoiceViewModel shape
 * (`DianUblToViewModelMapper`: documento.*, factura.*, fiscal.*, items[], …).
 * Realistic Colombia FE demo (not a real DIAN document).
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

/** 96-char hex demo CUFE (shape like DIAN; not a real document key). */
const SAMPLE_CUFE =
  'a7f3c91e2b8460d5e9a1c4f8b2d6703e5c1a9847d2e6b0f3a5c8e1d4b796203f8a1c5e9b2d4706f3a8c1e5b9d2047f6a3'

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
  const prefijo = 'SETP'
  const consecutivo = '990000042'
  const numero = `${prefijo}${consecutivo}`
  const autorizacion = '18764003901234'

  const emisor = {
    razonSocial: company.razonSocial ?? 'COMERCIAL ANDINA DEL PACÍFICO S.A.S.',
    nit: company.nit ?? '901458723-4',
    dv: company.dv ?? '4',
    telefono: company.telefono ?? '6044482190',
    direccion: company.direccion ?? 'Calle 10 Sur # 50-21 Oficina 302',
    ciudad: company.ciudad ?? 'Medellín',
    departamento: company.departamento ?? 'Antioquia',
    email: company.email ?? 'facturacion@andina-pacifico.co',
    responsabilidad: company.responsabilidad ?? 'Responsable de IVA',
  }

  // Line bases (cantidad × unitario), IVA 19%, total = base + iva
  // 1: 120000 → iva 22800 → 142800
  // 2: 135000 → iva 25650 → 160650
  // 3: 156000 → iva 29640 → 185640
  // 4: 250000 → iva 47500 → 297500
  // 5: 60000  → iva 11400 → 71400
  // 6: 95000  → iva 18050 → 113050
  // 7: 74000  → iva 14060 → 88060
  // 8: 66000  → iva 12540 → 78540
  // 9: 210000 → iva 39900 → 249900
  // 10: 51000 → iva 9690  → 60690
  // subtotal 1_217_000 | iva 231_230 | total 1_448_230 | qty 26
  const items = [
    {
      linea: 1,
      codigo: 'SRV-CONS-01',
      descripcion: 'Consultoría técnica en implementación FE',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 120000,
      descuento: 0,
      iva: 22800,
      total: 142800,
      valor: 142800,
    },
    {
      linea: 2,
      codigo: 'SRV-SOP-02',
      descripcion: 'Soporte mesa de ayuda (paquete mensual)',
      cantidad: 3,
      unidad: 'UND',
      valorUnitario: 45000,
      descuento: 0,
      iva: 25650,
      total: 160650,
      valor: 160650,
    },
    {
      linea: 3,
      codigo: 'LIC-BTW-03',
      descripcion: 'Licencia anual BTW Facturación Electrónica',
      cantidad: 2,
      unidad: 'UND',
      valorUnitario: 78000,
      descuento: 0,
      iva: 29640,
      total: 185640,
      valor: 185640,
    },
    {
      linea: 4,
      codigo: 'SRV-IMP-04',
      descripcion: 'Implementación e integración ERP',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 250000,
      descuento: 0,
      iva: 47500,
      total: 297500,
      valor: 297500,
    },
    {
      linea: 5,
      codigo: 'PRD-TON-05',
      descripcion: 'Toner láser compatible HP 26A',
      cantidad: 5,
      unidad: 'UND',
      valorUnitario: 12000,
      descuento: 0,
      iva: 11400,
      total: 71400,
      valor: 71400,
    },
    {
      linea: 6,
      codigo: 'SRV-CAP-06',
      descripcion: 'Capacitación usuarios funcionales (jornada)',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 95000,
      descuento: 0,
      iva: 18050,
      total: 113050,
      valor: 113050,
    },
    {
      linea: 7,
      codigo: 'PRD-PAP-07',
      descripcion: 'Resma papel bond carta 75 g (caja x10)',
      cantidad: 4,
      unidad: 'CJ',
      valorUnitario: 18500,
      descuento: 0,
      iva: 14060,
      total: 88060,
      valor: 88060,
    },
    {
      linea: 8,
      codigo: 'SRV-HOST-08',
      descripcion: 'Hosting y respaldo documental (mes)',
      cantidad: 2,
      unidad: 'UND',
      valorUnitario: 33000,
      descuento: 0,
      iva: 12540,
      total: 78540,
      valor: 78540,
    },
    {
      linea: 9,
      codigo: 'SRV-AUD-09',
      descripcion: 'Auditoría de cumplimiento DIAN',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 210000,
      descuento: 0,
      iva: 39900,
      total: 249900,
      valor: 249900,
    },
    {
      linea: 10,
      codigo: 'PRD-USB-10',
      descripcion: 'Memoria USB 64 GB corporativa',
      cantidad: 6,
      unidad: 'UND',
      valorUnitario: 8500,
      descuento: 0,
      iva: 9690,
      total: 60690,
      valor: 60690,
    },
  ]

  const sample: Record<string, unknown> = {
    numero,
    documento: {
      tipo: 'FACTURA ELECTRÓNICA DE VENTA',
      numero,
      prefijo,
      autorizacion,
      rangoDesde: '990000001',
      rangoHasta: '995000000',
      vigenciaInicio: '2025-03-15',
      vigenciaFin: '2027-03-14',
      fechaGeneracion: '2026-07-18',
      horaGeneracion: '14:32:18-05:00',
      fechaVencimiento: '2026-08-17',
      moneda: 'COP',
      cufe,
      qrUrl,
    },
    emisor,
    cliente: {
      nombre: 'DISTRIBUIDORA EL ROBLE S.A.S.',
      tipoDocumento: 'NIT',
      nit: '900665411-9',
      telefono: '3014567890',
      direccion: 'Carrera 15 # 93-07 Piso 4',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      pais: 'COLOMBIA',
      email: 'cuentas.por.pagar@elroble.com.co',
    },
    factura: {
      fecha: '2026-07-18',
      fechaVencimiento: '2026-08-17',
      formaPago: 'Crédito 30 días',
      medioPago: 'Transferencia Débito Bancaria',
      nroPedido: 'OC-2026-08421',
      lineaNegocio: 'Tecnología y servicios FE',
      fechaValidacionDian: '2026-07-18 14:32:41',
      fechaGeneracionErp: '2026-07-18 14:31:55',
    },
    fiscal: {
      autorizacion,
      prefijo,
      rangoDesde: '990000001',
      rangoHasta: '995000000',
      resolucion: `Autorización de numeración ${autorizacion} Prefijo ${prefijo} desde 990000001 hasta 995000000 vigencia 2025-03-15 a 2027-03-14`,
      cufe,
      qrUrl,
    },
    pago: {
      forma: 'Crédito',
      medio: 'Transferencia Débito Bancaria',
      plazo: '30 días',
      fechaVencimiento: '2026-08-17',
    },
    observaciones:
      'Factura de ejemplo para diseño de plantilla. Pagar a la cuenta Bancolombia 203-458921-45 a nombre del emisor.',
    items,
    totales: {
      subtotal1: 1217000,
      descuento: 0,
      subtotal2: 1217000,
      subtotal: 1217000,
      iva: 231230,
      ivaTarifa: '19%',
      inc: 0,
      impuestoConsumo: 0,
      impuestoConsumoTarifa: '0%',
      otrosImpuestos: 0,
      retenciones: 0,
      total: 1448230,
      totalItems: 26,
      valorEnLetras:
        'UN MILLÓN CUATROCIENTOS CUARENTA Y OCHO MIL DOSCIENTOS TREINTA PESOS M/CTE',
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
          factura: consecutivo,
          codigoPrestador: '050010123456',
          fechaInicio: '2026-07-01',
          fechaFin: '2026-07-18',
        },
      ],
      pacientes: [
        {
          tipoId: 'CC',
          numeroId: '1020304050',
          nombre: 'MARÍA FERNANDA GÓMEZ LÓPEZ',
          concepto: 'CONSULTA ESPECIALISTA',
          valor: '1448230',
          autorizacion: 'AUT-778812',
          poliza: 'POL-445566',
          contrato: 'CTR-2026-09',
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

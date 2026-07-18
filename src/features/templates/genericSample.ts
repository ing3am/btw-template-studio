/**
 * Generic editor sample (InvoiceViewModel shape).
 * Not tied to a real UBL / CUFE. Company fields can be overridden from a maestro.
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

export function buildGenericEditorSample(options?: {
  company?: CompanySampleOverride
  sectorSalud?: boolean
}): Record<string, unknown> {
  const company = options?.company ?? {}
  const sectorSalud = options?.sectorSalud ?? false

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
    numero: 'DEMO-1',
    documento: {
      tipo: 'FACTURA ELECTRÓNICA DE VENTA',
      numero: 'DEMO-1',
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
      cufe: SAMPLE_CUFE,
      qrUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${SAMPLE_CUFE}`,
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
      resolucion:
        'Resolución de ejemplo Prefijo DEMO desde 1 hasta 1000',
      cufe: SAMPLE_CUFE,
      qrUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${SAMPLE_CUFE}`,
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

export const GENERIC_EDITOR_SCHEMA = `{
  "type": "object",
  "required": ["documento", "emisor", "cliente", "pago", "items", "totales", "software"]
}`

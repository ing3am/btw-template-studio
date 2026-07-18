import { createDefaultFacturaBlocks } from '@/features/visual-builder/types'
import { serializeBlocksToDocument } from '@/features/visual-builder/serializeToHtml'
import { defaultPageSettings } from '@/features/visual-builder/pageSettings'
import type { TemplateBundle } from './types'

/**
 * Sample unificado:
 * - Layout Seis Amazonas / RC6403 (paths del builder FE)
 * - Catálogo DIAN (documento, pago, software) para checklist de etiquetas
 */
const CUFE =
  'e989984fbb5acc3316f4419a143df98c64b865d9a87704375428ed9d6f4650abf1e3c7a989bb044ce03a36c8935eec3d'

const MERGED_SAMPLE = {
  numero: 'RC6403',
  documento: {
    tipo: 'FACTURA ELECTRÓNICA DE VENTA',
    numero: 'RC6403',
    prefijo: 'RC',
    autorizacion: '18764111997444',
    rangoDesde: '6363',
    rangoHasta: '10000',
    vigenciaInicio: '2026-07-01',
    vigenciaFin: '2027-07-01',
    fechaGeneracion: '2026-07-14',
    horaGeneracion: '10:07:52-05:00',
    fechaVencimiento: '2026-09-12',
    moneda: 'COP',
    cufe: CUFE,
    qrUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${CUFE}`,
  },
  emisor: {
    razonSocial: 'RAMIRO CORREA RESTREPO SAS',
    nit: '800019606-9',
    dv: '9',
    telefono: '3174401369',
    direccion: 'CL 53 46 38 CONS 102',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    email: 'facturacion@ramirocorrea.co',
    responsabilidad: 'No responsable de IVA',
  },
  cliente: {
    nombre: 'PROMOTORA MEDICA Y ODONTOLOGICA DE ANTIOQUIA SA',
    tipoDocumento: 'NIT',
    nit: '900038926-4',
    telefono: '3122896948',
    direccion: 'Calle 53 # 46-38',
    ciudad: 'MEDELLIN',
    departamento: 'ANTIOQUIA',
    pais: 'COLOMBIA',
    email: 'facturacion@promedica.com',
  },
  factura: {
    fecha: '2026-07-14',
    fechaVencimiento: '2026-09-12',
    formaPago: 'Plazo 60 DÍAS',
    medioPago: 'Transferencia Débito Bancaria',
    nroPedido: '',
    lineaNegocio: '8621-ACT DE LA PRACTICA MEDICA, SIN INTERNACION.',
    fechaValidacionDian: '2026-07-14 10:07:58',
    fechaGeneracionErp: '2026-07-14 10:07:52',
  },
  fiscal: {
    autorizacion: '18764111997444',
    prefijo: 'RC',
    rangoDesde: '6363',
    rangoHasta: '10000',
    resolucion:
      'Resolución número 18764111997444 fecha autorización 01/07/2026 Prefijo RC desde el número 6363 hasta el 10000, Vigencia 12 meses',
    cufe: CUFE,
    qrUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${CUFE}`,
  },
  pago: {
    forma: 'Crédito',
    medio: 'Transferencia Débito Bancaria',
    plazo: '60 días',
    fechaVencimiento: '2026-09-12',
  },
  observaciones: '',
  items: [
    {
      linea: 1,
      codigo: '345001',
      descripcion: 'TORACENTESIS DIAGNOSTICA',
      cantidad: 1,
      unidad: 'SRV',
      valorUnitario: 116318,
      descuento: 0,
      iva: 0,
      total: 116318,
      valor: 116318,
    },
    {
      linea: 2,
      codigo: '881701',
      descripcion: 'ECOGRAFIA COMO GUIA PARA PROCEDIMIENTOS',
      cantidad: 1,
      unidad: 'SRV',
      valorUnitario: 41517,
      descuento: 0,
      iva: 0,
      total: 41517,
      valor: 41517,
    },
    {
      linea: 3,
      codigo: '7DS006',
      descripcion: 'DERECHOS DE SALA DE PROCEDIMIENTOS',
      cantidad: 1,
      unidad: 'SRV',
      valorUnitario: 116318,
      descuento: 0,
      iva: 0,
      total: 116318,
      valor: 116318,
    },
    {
      linea: 4,
      codigo: 'CAT16012',
      descripcion: 'CATETERES PARA DRENAJE PERCUTANEO',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 542766,
      descuento: 0,
      iva: 0,
      total: 542766,
      valor: 542766,
    },
    {
      linea: 5,
      codigo: 'BOL33002',
      descripcion: 'BOLSA DE DRENAJE DE TORAX',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 365655,
      descuento: 0,
      iva: 0,
      total: 365655,
      valor: 365655,
    },
    {
      linea: 6,
      codigo: 'SSA01003',
      descripcion: 'SODIO CLORURO 0,9% *250 ML',
      cantidad: 1,
      unidad: 'UND',
      valorUnitario: 3075,
      descuento: 0,
      iva: 0,
      total: 3075,
      valor: 3075,
    },
    {
      linea: 7,
      codigo: 'JER01002',
      descripcion: 'JERINGA 3P DESEC/ 20 ML',
      cantidad: 2,
      unidad: 'UND',
      valorUnitario: 2282,
      descuento: 0,
      iva: 0,
      total: 4564,
      valor: 4564,
    },
    {
      linea: 8,
      codigo: 'JER01001',
      descripcion: 'JERINGA 3P DESEC/ 10 ML',
      cantidad: 2,
      unidad: 'UND',
      valorUnitario: 322,
      descuento: 0,
      iva: 0,
      total: 644,
      valor: 644,
    },
    {
      linea: 9,
      codigo: 'AGU01012',
      descripcion: 'AGUJA HIPODERMICA /18-20-21-22-23-26',
      cantidad: 2,
      unidad: 'UND',
      valorUnitario: 171,
      descuento: 0,
      iva: 0,
      total: 342,
      valor: 342,
    },
  ],
  totales: {
    subtotal1: 1191199,
    descuento: 0,
    subtotal2: 1191199,
    subtotal: 1191199,
    iva: 0,
    ivaTarifa: '0%',
    inc: 0,
    impuestoConsumo: 0,
    impuestoConsumoTarifa: '0%',
    otrosImpuestos: 0,
    retenciones: 0,
    total: 1191199,
    totalItems: 12,
    valorEnLetras:
      'UN MILLÓN CIENTO NOVENTA Y UN MIL CIENTO NOVENTA Y NUEVE PESOS',
  },
  software: {
    fabricante: 'Bythewave S.A.S.',
    fabricanteNit: '900665411',
    nombre: 'BTW Facturación Electrónica',
    proveedor: 'Bythewave S.A.S.',
  },
  anexoSalud: {
    cabecera: [
      {
        factura: '877',
        codigoPrestador: '050010162101',
        fechaInicio: '2026-06-30',
        fechaFin: '2026-07-14',
      },
    ],
    pacientes: [
      {
        tipoId: 'CC',
        numeroId: '43578072',
        nombre: 'FLOR PARRA',
        concepto: 'PROCEDIMIENTO',
        valor: '1191199',
        autorizacion: '93173',
        poliza: '',
        contrato: '',
        fechaIngreso: '2026-06-30',
        fechaSalida: '2026-06-30',
      },
    ],
  },
}

const MERGED_SCHEMA = `{
  "type": "object",
  "required": ["numero", "documento", "emisor", "cliente", "factura", "fiscal", "pago", "items", "totales", "software"]
}`

function now() {
  return new Date().toISOString()
}

function buildVersion(templateId: string, versionId: string) {
  const blocks = createDefaultFacturaBlocks()
  const { html, css } = serializeBlocksToDocument(blocks, defaultPageSettings())
  return {
    id: versionId,
    templateId,
    versionNumber: 1,
    html,
    css,
    schemaJson: MERGED_SCHEMA,
    sampleDataJson: JSON.stringify(MERGED_SAMPLE, null, 2),
    blocksJson: JSON.stringify(blocks),
    createdAt: now(),
    isPublished: false,
  }
}

export function createSeedBundles(): TemplateBundle[] {
  const templateId = 'factura-electronica-rc'
  return [
    {
      template: {
        id: templateId,
        name: 'Factura electrónica · Seis Amazonas (RC6403)',
        documentType: 'factura',
        status: 'draft',
        currentVersionNumber: 1,
        updatedAt: now(),
      },
      versions: [buildVersion(templateId, 'ver-factura-rc-1')],
    },
  ]
}

export function createBlankBundle(
  name: string,
  documentType: TemplateBundle['template']['documentType'],
): TemplateBundle {
  const templateId = crypto.randomUUID()
  const versionId = crypto.randomUUID()
  const createdAt = now()
  return {
    template: {
      id: templateId,
      name,
      documentType,
      status: 'draft',
      currentVersionNumber: 1,
      updatedAt: createdAt,
    },
    versions: [buildVersion(templateId, versionId)],
  }
}

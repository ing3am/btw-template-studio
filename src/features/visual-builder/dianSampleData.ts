/** Complete sample aligned to DIAN label catalog paths. */
export const DIAN_SAMPLE_DATA = {
  documento: {
    tipo: 'Factura electrónica de venta',
    numero: 'AM12847',
    prefijo: 'AM',
    autorizacion: '18764099750162',
    rangoDesde: '7089',
    rangoHasta: '20000',
    vigenciaInicio: '2025-10-06',
    vigenciaFin: '2026-10-06',
    fechaGeneracion: '2026-07-16',
    horaGeneracion: '02:30:06-05:00',
    fechaVencimiento: '2026-07-21',
    moneda: 'COP',
    cufe: '8965881bf911dc57cea84f152750c1e996b7a46226269ecf7a004fb039699c13eee099c11cba2b7d8f9f85d96bdffd16',
    qrUrl:
      'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=8965881bf911dc57cea84f152750c1e996b7a46226269ecf7a004fb039699c13eee099c11cba2b7d8f9f85d96bdffd16',
  },
  emisor: {
    razonSocial: 'Bythewave S.A.S.',
    nit: '900665411',
    dv: '2',
    direccion: 'Carrera 50 FF 8 Sur 27 – Edificio 808 - Oficina 220',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    telefono: '6047282',
    email: 'contabilidad@btw.com.co',
    responsabilidad: 'No responsable de IVA / R-99-PN',
  },
  cliente: {
    nombre: 'Jennifer Daniela Pérez Orozco',
    nit: '1090462044',
    tipoDocumento: 'Cédula de ciudadanía',
    direccion: 'CL 9 N 10 E 20 BRR GUAIMARAL',
    ciudad: 'Cúcuta',
    departamento: 'Norte de Santander',
    telefono: '3143409448',
    email: 'ixoragrodistribuidores@hotmail.com',
  },
  pago: {
    forma: 'Crédito',
    medio: 'Transferencia electrónica',
    plazo: '5 días',
    fechaVencimiento: '2026-07-21',
  },
  items: [
    {
      descripcion: 'Plan facturación electrónica dinámico',
      cantidad: 1,
      unidad: 'unidad',
      codigo: 'BASIC_PERSONALIZED',
      valorUnitario: 506389,
      valor: 506389,
    },
  ],
  totales: {
    subtotal: 506389,
    iva: 0,
    ivaTarifa: '0%',
    impuestoConsumo: 0,
    impuestoConsumoTarifa: '0%',
    otrosImpuestos: 0,
    total: 506389,
  },
  software: {
    fabricante: 'Bythewave S.A.S.',
    fabricanteNit: '900665411',
    nombre: 'BTW Facturación Electrónica',
    proveedor: 'Bythewave S.A.S.',
  },
} as const

export const DIAN_SAMPLE_DATA_JSON = JSON.stringify(DIAN_SAMPLE_DATA, null, 2)

export const DIAN_SCHEMA_JSON = `{
  "type": "object",
  "required": ["documento", "emisor", "cliente", "pago", "items", "totales", "software"]
}`

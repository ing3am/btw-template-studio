import { getSessionCompanyId, getSessionNit, readSession } from '@/features/auth/api'
import { withNetworkActivity } from '@/shared/lib/networkActivity'

export type InvoicesQuery = {
  fechaFactura: string
  fInicial: string
  fFinal: string
  numFactura?: string
  uuid?: string
  pageNumber: number
  pageSize: number
}

export type InvoiceRow = {
  id: string
  numero: string
  legalNum: string
  fecha: string
  cufe: string
  cliente: string
  nitCliente: string
  tipo: string
  aceptaDian: boolean | null
  pathPdf: string
  raw: Record<string, unknown>
}

export type InvoicesPage = {
  items: InvoiceRow[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const INVOICES_PATH =
  '/api-auth/documentfe-test/DocumentFE/GetInvoicesPaginated'

function ambienteFromEnv(): string {
  const code = (import.meta.env.VITE_AUTH_AMBIENTE || '02').trim()
  return code === '01' ? 'PROD' : 'UAT'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function pickBool(row: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'boolean') return value
  }
  return null
}

/** Formats API dates like `2026-07-18T00:00:00` → `18/07/2026`. */
function formatDate(value: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-CO')
}

function humanTipo(tipo: string): string {
  const cleaned = tipo.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const map: Record<string, string> = {
    InvoiceType: 'Factura',
    CreditNoteType: 'Nota crédito',
    DebitNoteType: 'Nota débito',
  }
  return map[cleaned] || cleaned
}

function normalizeRow(raw: unknown, index: number): InvoiceRow {
  const row = asRecord(raw) ?? {}
  const numero = pickString(row, ['numFactura', 'numeroFactura', 'numero'])
  const legalNum = pickString(row, ['legalNum', 'LegalNum'])
  const cufe = pickString(row, ['cufe', 'CUFE', 'uuid', 'cude', 'CUDE'])
  const fechaRaw = pickString(row, ['fechaFactura', 'FechaFactura', 'fecha'])

  return {
    id:
      pickString(row, ['sysRowID', 'cufe', 'legalNum']) ||
      `${numero || 'row'}-${legalNum || index}`,
    numero: numero || '—',
    legalNum: legalNum || '—',
    fecha: formatDate(fechaRaw) || '—',
    cufe: cufe || '—',
    cliente: pickString(row, ['cliente', 'razonSocialCliente', 'nombreCliente']) || '—',
    nitCliente: pickString(row, ['nitCliente', 'NitCliente']) || '—',
    tipo: humanTipo(pickString(row, ['tipoFactura', 'TipoFactura', 'tipo'])),
    aceptaDian: pickBool(row, ['aceptaDian', 'AceptaDian']),
    pathPdf: pickString(row, ['pathPdfInvoice', 'pathPdf']),
    raw: row,
  }
}

function extractResult(payload: Record<string, unknown>): Record<string, unknown> {
  return asRecord(payload.result) ?? asRecord(payload.data) ?? payload
}

function extractItems(payload: Record<string, unknown>): unknown[] {
  const result = extractResult(payload)
  const candidates = [result.items, result.data, result.rows, payload.items]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

export async function fetchInvoicesPaginated(
  query: InvoicesQuery,
): Promise<InvoicesPage> {
  const session = readSession()
  if (!session?.token) {
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
  }

  const nit = getSessionNit()
  // Some tenants use alphanumeric company codes; others send the NIT as companyID.
  let companyID = ''
  try {
    companyID = getSessionCompanyId()
  } catch {
    companyID = nit
  }
  if (!companyID) companyID = nit

  const body = {
    companyID,
    nit,
    fechaFactura: query.fechaFactura,
    fInicial: query.fInicial,
    fFinal: query.fFinal,
    numFactura: query.numFactura?.trim() || '',
    legalNum: '',
    uuid: query.uuid?.trim() || '',
    tipoFactura: 'InvoiceType',
    ambiente: ambienteFromEnv(),
    Correo: '',
    legalNumSEmail: '',
    pageNumber: query.pageNumber,
    pageSize: query.pageSize,
  }

  return withNetworkActivity(async () => {
    const response = await fetch(INVOICES_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(body),
    })

    const rawText = await response.text()
    let payload: Record<string, unknown> = {}
    if (rawText.trim()) {
      try {
        payload = JSON.parse(rawText) as Record<string, unknown>
      } catch {
        throw new Error(
          rawText.slice(0, 180) || 'Respuesta inválida del servicio de documentos',
        )
      }
    }

    if (!response.ok || payload.success === false) {
      const message =
        pickString(payload, ['message', 'error', 'Message', 'Error']) ||
        `Error HTTP ${response.status}`
      throw new Error(message)
    }

    const result = extractResult(payload)
    const rawItems = extractItems(payload)
    const items = rawItems.map(normalizeRow)
    const pageSize =
      pickNumber(result, ['pageSize', 'PageSize']) ?? query.pageSize
    const pageNumber =
      pickNumber(result, ['page', 'pageNumber', 'PageNumber']) ?? query.pageNumber
    const totalCount =
      pickNumber(result, ['total', 'totalCount', 'TotalCount']) ?? items.length
    const totalPages =
      pickNumber(result, ['totalPages', 'TotalPages']) ??
      Math.max(1, Math.ceil(totalCount / pageSize) || 1)

    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
    }
  })
}

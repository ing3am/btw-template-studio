import { useCallback, useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileSearch,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useAuth, useCompanyId, useCompanyNit } from '@/features/auth/AuthProvider'
import { GeneratePdfWizard } from '@/features/documents/GeneratePdfWizard'
import {
  fetchInvoicesPaginated,
  type InvoiceRow,
} from '@/features/documents/api'
import type { DocumentType } from '@/features/templates/types'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/Toast'
import styles from './DocumentsPage.module.css'

const PAGE_SIZE = 10

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthInputFromDate(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function shortCufe(value: string): string {
  if (!value || value === '—') return '—'
  if (value.length <= 28) return value
  return `${value.slice(0, 14)}…${value.slice(-10)}`
}

function dianLabel(acepta: boolean | null): {
  text: string
  tone: 'ok' | 'bad' | 'neutral'
} {
  if (acepta === true) return { text: 'Aceptada DIAN', tone: 'ok' }
  if (acepta === false) return { text: 'Rechazada / pendiente', tone: 'bad' }
  return { text: 'Sin respuesta', tone: 'neutral' }
}

/** GetInvoicesPaginated: `aceptaDian` / `AceptaDian` — false = rechazada (o no aceptada). */
function isDianRejected(acepta: boolean | null): boolean {
  return acepta === false
}

function documentTypeFromRow(row: InvoiceRow): DocumentType {
  const raw = String(row.raw.tipoFactura || row.tipo || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (/CreditNote/i.test(raw) || /nota\s*cr[eé]dito/i.test(raw)) {
    return 'nota_credito'
  }
  if (/DebitNote/i.test(raw) || /nota\s*d[eé]bito/i.test(raw)) {
    return 'nota_debito'
  }
  return 'factura'
}

function hasExistingPdf(row: InvoiceRow): boolean {
  return Boolean(row.pathPdf?.trim())
}

export function DocumentsPage() {
  const toast = useToast()
  const { session } = useAuth()
  const nit = useCompanyNit()
  const companyId = useCompanyId()

  const [month, setMonth] = useState(() => monthInputFromDate(todayIso()))
  const [fInicial, setFInicial] = useState(todayIso)
  const [fFinal, setFFinal] = useState(todayIso)
  const [numFactura, setNumFactura] = useState('')
  const [uuid, setUuid] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [items, setItems] = useState<InvoiceRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfRow, setPdfRow] = useState<InvoiceRow | null>(null)
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null)

  const fechaFactura = useMemo(() => `${month}-01`, [month])
  const canPrev = pageNumber > 1
  const canNext = pageNumber < totalPages && items.length > 0
  const pdfDocumentType = pdfRow ? documentTypeFromRow(pdfRow) : 'factura'

  const closePdfWizard = useCallback(() => {
    setPdfOpen(false)
    setPdfRow(null)
    setPdfBusyId(null)
  }, [])

  const copyCufe = useCallback(
    async (row: InvoiceRow) => {
      if (!row.cufe || row.cufe === '—') return
      try {
        await navigator.clipboard.writeText(row.cufe)
        setCopiedId(row.id)
        toast.push('CUFE copiado', 'success')
        window.setTimeout(
          () => setCopiedId((cur) => (cur === row.id ? null : cur)),
          1600,
        )
      } catch {
        toast.push('No se pudo copiar el CUFE', 'error')
      }
    },
    [toast],
  )

  const openPdfWizard = useCallback(
    (row: InvoiceRow) => {
      if (!nit) {
        toast.push('No hay NIT en la sesión. Vuelve a iniciar sesión.', 'error')
        return
      }
      if (isDianRejected(row.aceptaDian)) {
        toast.push(
          'No se puede generar PDF de una factura rechazada por la DIAN.',
          'info',
        )
        return
      }
      if (!row.cufe || row.cufe === '—') {
        toast.push('Esta factura no tiene CUFE para generar el PDF.', 'error')
        return
      }
      setPdfRow(row)
      setPdfBusyId(row.id)
      setPdfOpen(true)
    },
    [nit, toast],
  )

  const load = useCallback(
    async (page: number) => {
      if (!nit) {
        setError('Falta NIT en la sesión. Vuelve a iniciar sesión.')
        return
      }
      if (!fInicial || !fFinal) {
        setError('Selecciona el rango de fechas.')
        return
      }
      if (fInicial > fFinal) {
        setError('La fecha inicial no puede ser posterior a la final.')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await fetchInvoicesPaginated({
          fechaFactura,
          fInicial,
          fFinal,
          numFactura,
          uuid,
          pageNumber: page,
          pageSize: PAGE_SIZE,
        })
        setItems(result.items)
        setTotalCount(result.totalCount)
        setPageNumber(result.pageNumber)
        setTotalPages(result.totalPages)
        setSearched(true)
        if (result.items.length === 0) {
          toast.push('No hay documentos para estos filtros', 'info')
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No pudimos consultar los documentos'
        setError(message)
        setItems([])
        setTotalCount(0)
        setTotalPages(1)
        toast.push(message, 'error')
      } finally {
        setLoading(false)
      }
    },
    [fFinal, fInicial, fechaFactura, nit, numFactura, toast, uuid],
  )

  function onSearch(event: React.FormEvent) {
    event.preventDefault()
    void load(1)
  }

  const from = totalCount === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1
  const to = Math.min(pageNumber * PAGE_SIZE, totalCount)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Facturación electrónica</p>
          <h1 className={styles.title}>Documentos</h1>
          <p className={styles.lead}>
            Consulta facturas por rango de fechas y número. Genera o re-grafica el
            PDF con la plantilla publicada usando el CUFE.
          </p>
        </div>
      </header>

      <div className={styles.summary}>
        <div className={styles.company}>
          <span className={styles.label}>Empresa</span>
          <strong className={styles.companyName}>
            {session?.razonSocial || 'Sin razón social'}
          </strong>
          <span className={styles.metaLine}>
            NIT {nit || '—'}
            {companyId ? ` · ${companyId}` : ''}
          </span>
        </div>
        <div className={styles.hintCard}>
          <span className={styles.label}>Cómo filtrar</span>
          <p>
            El mes fija el periodo contable. Ajusta «Desde» y «Hasta» para
            acotar el listado, o busca por número / CUFE.
          </p>
        </div>
      </div>

      {!nit ? (
        <EmptyState
          title="Sesión incompleta"
          description="Vuelve a iniciar sesión para cargar el NIT antes de consultar documentos."
          icon={<FileSearch size={22} />}
        />
      ) : (
        <>
          <form className={styles.filters} onSubmit={onSearch}>
            <label className={styles.field}>
              <span>Mes</span>
              <input
                type="month"
                value={month}
                onChange={(event) => {
                  const next = event.target.value
                  setMonth(next)
                  const start = `${next}-01`
                  setFInicial(start)
                  const [y, m] = next.split('-').map(Number)
                  const last = new Date(y, m, 0).getDate()
                  setFFinal(`${next}-${String(last).padStart(2, '0')}`)
                }}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>Desde</span>
              <input
                type="date"
                value={fInicial}
                onChange={(event) => {
                  const next = event.target.value
                  setFInicial(next)
                  setMonth(monthInputFromDate(next))
                }}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>Hasta</span>
              <input
                type="date"
                value={fFinal}
                onChange={(event) => setFFinal(event.target.value)}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>Nº factura</span>
              <input
                value={numFactura}
                onChange={(event) => setNumFactura(event.target.value)}
                placeholder="Opcional"
                disabled={loading}
                autoComplete="off"
              />
            </label>

            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>CUFE / UUID</span>
              <input
                value={uuid}
                onChange={(event) => setUuid(event.target.value)}
                placeholder="Opcional"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <div className={styles.filterActions}>
              <Button
                type="submit"
                disabled={loading}
                icon={
                  loading ? (
                    <LoaderCircle size={16} className={styles.spin} />
                  ) : (
                    <Search size={16} />
                  )
                }
              >
                {loading ? 'Consultando…' : 'Buscar documentos'}
              </Button>
            </div>
          </form>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.results}>
            <div className={styles.resultsHead}>
              <div>
                <h2>Resultados</h2>
                <p>
                  {searched
                    ? totalCount > 0
                      ? `Mostrando ${from}–${to} de ${totalCount}`
                      : 'Sin coincidencias'
                    : 'Define filtros y busca para ver documentos'}
                </p>
              </div>
              {searched && totalCount > 0 ? (
                <div className={styles.pager}>
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<ChevronLeft size={16} />}
                    disabled={!canPrev || loading}
                    onClick={() => void load(pageNumber - 1)}
                  >
                    Anterior
                  </Button>
                  <span className={styles.pageLabel}>
                    Página {pageNumber} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    icon={<ChevronRight size={16} />}
                    disabled={!canNext || loading}
                    onClick={() => void load(pageNumber + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </div>

            {!loading && searched && items.length === 0 ? (
              <EmptyState
                title="No encontramos documentos"
                description="Prueba otro rango de fechas o limpia el número / CUFE."
                icon={<FileSearch size={22} />}
              />
            ) : null}

            {!loading && items.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Legal / prefijo</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>NIT cliente</th>
                      <th>DIAN</th>
                      <th>CUFE</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const dian = dianLabel(row.aceptaDian)
                      const rejected = isDianRejected(row.aceptaDian)
                      const rowBusy = pdfBusyId === row.id
                      const canGenerate = Boolean(row.cufe && row.cufe !== '—')
                      const showPdfAction = canGenerate && !rejected
                      const regraph = hasExistingPdf(row)
                      return (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.numero}</strong>
                            {row.tipo ? <em>{row.tipo}</em> : null}
                          </td>
                          <td className={styles.mono}>{row.legalNum}</td>
                          <td className={styles.num}>{row.fecha}</td>
                          <td>
                            <span className={styles.cliente} title={row.cliente}>
                              {row.cliente}
                            </span>
                          </td>
                          <td className={styles.num}>{row.nitCliente}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${styles[`badge_${dian.tone}`]}`}
                            >
                              {dian.text}
                            </span>
                          </td>
                          <td>
                            <div className={styles.cufeCell}>
                              <code className={styles.mono} title={row.cufe}>
                                {shortCufe(row.cufe)}
                              </code>
                              {canGenerate ? (
                                <button
                                  type="button"
                                  className={styles.copyBtn}
                                  onClick={() => void copyCufe(row)}
                                  aria-label="Copiar CUFE"
                                  title="Copiar CUFE"
                                >
                                  {copiedId === row.id ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            {showPdfAction ? (
                              <Button
                                type="button"
                                variant="secondary"
                                className={styles.pdfBtn}
                                disabled={Boolean(pdfBusyId)}
                                icon={
                                  rowBusy ? (
                                    <LoaderCircle
                                      size={15}
                                      className={styles.spin}
                                    />
                                  ) : regraph ? (
                                    <RefreshCw size={15} />
                                  ) : (
                                    <FileText size={15} />
                                  )
                                }
                                onClick={() => openPdfWizard(row)}
                              >
                                {rowBusy
                                  ? 'Abriendo…'
                                  : regraph
                                    ? 'Re-graficar PDF'
                                    : 'Generar PDF'}
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {!loading && !searched ? (
              <div className={styles.idle}>
                <FileSearch size={22} aria-hidden />
                <p>Los documentos aparecerán aquí después de buscar.</p>
              </div>
            ) : null}
          </div>
        </>
      )}

      <GeneratePdfWizard
        open={pdfOpen}
        row={pdfRow}
        nit={nit}
        documentType={pdfDocumentType}
        onClose={closePdfWizard}
        onBusyChange={(busy) => {
          if (!busy) setPdfBusyId(null)
          else if (pdfRow) setPdfBusyId(pdfRow.id)
        }}
      />
    </section>
  )
}

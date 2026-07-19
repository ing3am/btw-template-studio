import { createBlankBundle, createSeedBundles } from './seed'
import { authHeaders, getApiBase, isUsingMocks } from './apiBase'
import type {
  CreateTemplateInput,
  SaveDraftInput,
  Template,
  TemplateBundle,
  TemplateVersion,
  VersionStatus,
} from './types'

/** Bumped: version status draft/published/used. */
const STORAGE_KEY = 'btw-template-studio.templates.v22'

const useMocks = isUsingMocks()

function readStore(): TemplateBundle[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedBundles()
    writeStore(seed)
    return seed
  }
  try {
    return JSON.parse(raw) as TemplateBundle[]
  } catch {
    const seed = createSeedBundles()
    writeStore(seed)
    return seed
  }
}

function writeStore(bundles: TemplateBundle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles))
}

function delay(ms = 180) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeNit(nit?: string | null): string {
  if (!nit) return ''
  return nit.replace(/\D/g, '')
}

function withNitQuery(path: string, nit: string): string {
  const normalized = normalizeNit(nit)
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}nit=${encodeURIComponent(normalized)}`
}

function latestVersion(bundle: TemplateBundle): TemplateVersion {
  return [...bundle.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0]
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = getApiBase()

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function versionStatusOf(version: TemplateVersion): VersionStatus {
  if (version.status) return version.status
  return version.isPublished ? 'published' : 'draft'
}

function syncTemplateMeta(bundle: TemplateBundle): Template {
  const tip = latestVersion(bundle)
  const tipStatus = versionStatusOf(tip)
  const published = [...bundle.versions]
    .filter((v) => versionStatusOf(v) === 'published')
    .sort((a, b) => b.versionNumber - a.versionNumber)[0]
  const hasDraft = tipStatus === 'draft'
  return {
    ...bundle.template,
    status: published ? 'published' : 'draft',
    currentVersionNumber: hasDraft
      ? tip.versionNumber
      : (published?.versionNumber ?? tip.versionNumber),
    publishedVersionNumber: published?.versionNumber ?? 0,
    hasDraft,
  }
}

function normalizeTemplate(raw: Template & { updatedAt: string | Date; nit?: string }): Template {
  return {
    id: String(raw.id),
    name: raw.name,
    documentType: raw.documentType,
    status: raw.status,
    currentVersionNumber: raw.currentVersionNumber,
    publishedVersionNumber: raw.publishedVersionNumber ?? 0,
    hasDraft: Boolean(raw.hasDraft),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(raw.updatedAt).toISOString(),
    nit: raw.nit?.trim() || undefined,
  }
}

function normalizeVersion(raw: TemplateVersion & { createdAt: string | Date }): TemplateVersion {
  const status: VersionStatus =
    raw.status ?? (raw.isPublished ? 'published' : 'draft')
  return {
    id: String(raw.id),
    templateId: String(raw.templateId),
    versionNumber: raw.versionNumber,
    html: raw.html ?? '',
    css: raw.css ?? '',
    schemaJson: raw.schemaJson ?? '{}',
    sampleDataJson: raw.sampleDataJson ?? '{}',
    blocksJson: raw.blocksJson ?? '[]',
    assetsJson: raw.assetsJson ?? '[]',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(raw.createdAt).toISOString(),
    isPublished: status === 'published',
    status,
  }
}

function normalizeBundle(raw: {
  template: Template & { updatedAt: string | Date }
  versions: Array<TemplateVersion & { createdAt: string | Date }>
}): TemplateBundle {
  return {
    template: normalizeTemplate(raw.template),
    versions: (raw.versions ?? []).map(normalizeVersion),
  }
}

async function listTemplatesMock(nit?: string): Promise<Template[]> {
  await delay()
  const normalized = normalizeNit(nit)
  return readStore()
    .map((bundle) => bundle.template)
    .filter((template) => !normalized || normalizeNit(template.nit) === normalized)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function getTemplateBundleMock(id: string, nit?: string): Promise<TemplateBundle> {
  await delay()
  const bundle = readStore().find((item) => item.template.id === id)
  if (!bundle) {
    throw new Error('No encontramos esa plantilla.')
  }
  const normalized = normalizeNit(nit)
  if (normalized && normalizeNit(bundle.template.nit) !== normalized) {
    throw new Error('No encontramos esa plantilla.')
  }
  return bundle
}

async function createTemplateMock(input: CreateTemplateInput): Promise<Template> {
  await delay()
  const bundles = readStore()
  const bundle = createBlankBundle(input.name, input.documentType, {
    nit: input.nit,
    sectorSalud: input.sectorSalud ?? false,
  })
  writeStore([bundle, ...bundles])
  return bundle.template
}

async function saveDraftMock(id: string, input: SaveDraftInput): Promise<TemplateVersion> {
  await delay()
  if ((input.status ?? 'draft') === 'published') {
    return publishTemplateMock(id)
  }

  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) {
    throw new Error('No encontramos esa plantilla.')
  }

  const bundle = bundles[index]
  const tip = latestVersion(bundle)
  const tipStatus = versionStatusOf(tip)
  const createdAt = new Date().toISOString()
  const content = {
    html: input.html ?? tip.html,
    css: input.css ?? tip.css,
    schemaJson: input.schemaJson ?? tip.schemaJson,
    sampleDataJson: input.sampleDataJson ?? tip.sampleDataJson,
    blocksJson: input.blocksJson ?? tip.blocksJson,
    assetsJson: input.assetsJson ?? tip.assetsJson,
  }

  // Published/used tips are immutable — fork a new draft.
  if (tipStatus !== 'draft') {
    const draftVersion: TemplateVersion = {
      id: crypto.randomUUID(),
      templateId: id,
      versionNumber: tip.versionNumber + 1,
      ...content,
      createdAt,
      isPublished: false,
      status: 'draft',
    }
    const nextBundle: TemplateBundle = {
      template: bundle.template,
      versions: [draftVersion, ...bundle.versions],
    }
    nextBundle.template = { ...syncTemplateMeta(nextBundle), updatedAt: createdAt }
    bundles[index] = nextBundle
    writeStore(bundles)
    return draftVersion
  }

  const updatedVersion: TemplateVersion = {
    ...tip,
    ...content,
    createdAt,
    isPublished: false,
    status: 'draft',
  }

  const nextBundle: TemplateBundle = {
    template: bundle.template,
    versions: [
      updatedVersion,
      ...bundle.versions.filter((version) => version.id !== tip.id),
    ],
  }
  nextBundle.template = { ...syncTemplateMeta(nextBundle), updatedAt: createdAt }
  bundles[index] = nextBundle
  writeStore(bundles)
  return updatedVersion
}

async function publishTemplateMock(id: string): Promise<TemplateVersion> {
  await delay()
  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) {
    throw new Error('No encontramos esa plantilla.')
  }

  const bundle = bundles[index]
  const tip = latestVersion(bundle)
  const tipStatus = versionStatusOf(tip)
  const publishedAt = new Date().toISOString()

  if (tipStatus === 'published') {
    return tip
  }
  if (tipStatus === 'used') {
    throw new Error('No se puede publicar una versión usada. Guarda un borrador primero.')
  }

  const publishedVersion: TemplateVersion = {
    ...tip,
    createdAt: publishedAt,
    isPublished: true,
    status: 'published',
  }

  const nextBundle: TemplateBundle = {
    template: bundle.template,
    versions: bundle.versions.map((version) => {
      if (version.id === tip.id) return publishedVersion
      if (versionStatusOf(version) === 'published') {
        return { ...version, isPublished: false, status: 'used' as const }
      }
      return version
    }),
  }
  nextBundle.template = { ...syncTemplateMeta(nextBundle), updatedAt: publishedAt }
  bundles[index] = nextBundle
  writeStore(bundles)
  return publishedVersion
}

async function deleteDraftMock(id: string): Promise<void> {
  await delay()
  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) {
    throw new Error('No encontramos esa plantilla.')
  }
  const bundle = bundles[index]
  const tip = latestVersion(bundle)
  if (versionStatusOf(tip) !== 'draft') {
    throw new Error('Solo se puede descartar un borrador.')
  }
  if (bundle.versions.length === 1) {
    throw new Error('No se puede descartar la única versión.')
  }
  const nextBundle: TemplateBundle = {
    template: bundle.template,
    versions: bundle.versions.filter((v) => v.id !== tip.id),
  }
  nextBundle.template = {
    ...syncTemplateMeta(nextBundle),
    updatedAt: new Date().toISOString(),
  }
  bundles[index] = nextBundle
  writeStore(bundles)
}

async function listTemplatesApi(nit: string): Promise<Template[]> {
  const items = await apiFetch<Array<Template & { updatedAt: string }>>(
    withNitQuery('/templates', nit),
  )
  return items.map(normalizeTemplate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function getTemplateBundleApi(id: string, nit: string): Promise<TemplateBundle> {
  const bundle = await apiFetch<{
    template: Template & { updatedAt: string }
    versions: Array<TemplateVersion & { createdAt: string }>
  }>(withNitQuery(`/templates/${id}`, nit))
  return normalizeBundle(bundle)
}

async function createTemplateApi(input: CreateTemplateInput): Promise<Template> {
  const blank = createBlankBundle(input.name, input.documentType, {
    nit: input.nit,
    sectorSalud: input.sectorSalud ?? false,
  })
  const version = blank.versions[0]
  const created = await apiFetch<Template & { updatedAt: string }>('/templates', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      documentType: input.documentType,
      nit: normalizeNit(input.nit),
      sectorSalud: input.sectorSalud ?? false,
      html: version.html,
      css: version.css,
      schemaJson: version.schemaJson,
      sampleDataJson: version.sampleDataJson,
      blocksJson: version.blocksJson,
      pageJson: '{}',
    }),
  })
  return normalizeTemplate(created)
}

async function saveDraftApi(id: string, input: SaveDraftInput, nit: string): Promise<TemplateVersion> {
  const { status, ...content } = input
  const version = await apiFetch<TemplateVersion & { createdAt: string }>(
    withNitQuery(`/templates/${id}/draft`, nit),
    {
      method: 'PUT',
      body: JSON.stringify({
        status: status ?? 'draft',
        ...content,
      }),
    },
  )
  return normalizeVersion(version)
}

async function publishTemplateApi(id: string, nit: string): Promise<TemplateVersion> {
  // Backend publishes via draft upsert with status=published (no POST /publish).
  return saveDraftApi(id, { status: 'published' }, nit)
}

export async function listTemplates(nit: string): Promise<Template[]> {
  return useMocks ? listTemplatesMock(nit) : listTemplatesApi(nit)
}

export async function getTemplateBundle(id: string, nit: string): Promise<TemplateBundle> {
  return useMocks ? getTemplateBundleMock(id, nit) : getTemplateBundleApi(id, nit)
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  return useMocks ? createTemplateMock(input) : createTemplateApi(input)
}

export async function saveDraft(
  id: string,
  input: SaveDraftInput,
  nit: string,
): Promise<TemplateVersion> {
  return useMocks ? saveDraftMock(id, input) : saveDraftApi(id, input, nit)
}

export async function publishTemplate(id: string, nit: string): Promise<TemplateVersion> {
  return useMocks ? publishTemplateMock(id) : publishTemplateApi(id, nit)
}

async function deleteDraftApi(id: string, nit: string): Promise<void> {
  await apiFetch<void>(withNitQuery(`/templates/${id}/draft`, nit), { method: 'DELETE' })
}

export async function deleteDraft(id: string, nit: string): Promise<void> {
  return useMocks ? deleteDraftMock(id) : deleteDraftApi(id, nit)
}

async function rollbackVersionMock(
  id: string,
  versionNumber: number,
): Promise<TemplateVersion> {
  await delay()
  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) throw new Error('No encontramos esa plantilla.')
  const bundle = bundles[index]
  let versions = [...bundle.versions]
  const target = versions.find((v) => v.versionNumber === versionNumber)
  if (!target) throw new Error(`No existe la versión ${versionNumber}.`)
  if (versionStatusOf(target) === 'published') return target
  if (versionStatusOf(target) !== 'used') {
    throw new Error('Solo se puede volver a una versión usada (ya publicada antes).')
  }

  const tip = latestVersion(bundle)
  if (versionStatusOf(tip) === 'draft') {
    if (versions.length <= 1) throw new Error('No se puede descartar el único borrador.')
    versions = versions.filter((v) => v.id !== tip.id)
  }

  const publishedAt = new Date().toISOString()
  versions = versions.map((v) => {
    if (v.versionNumber === versionNumber) {
      return { ...v, status: 'published' as const, isPublished: true, createdAt: publishedAt }
    }
    if (versionStatusOf(v) === 'published') {
      return { ...v, status: 'used' as const, isPublished: false }
    }
    return v
  })

  const nextBundle: TemplateBundle = { template: bundle.template, versions }
  nextBundle.template = { ...syncTemplateMeta(nextBundle), updatedAt: publishedAt }
  bundles[index] = nextBundle
  writeStore(bundles)
  return versions.find((v) => v.versionNumber === versionNumber)!
}

async function rollbackVersionApi(
  id: string,
  versionNumber: number,
  nit: string,
): Promise<TemplateVersion> {
  const version = await apiFetch<TemplateVersion & { createdAt: string }>(
    withNitQuery(`/templates/${id}/versions/${versionNumber}/rollback`, nit),
    { method: 'POST' },
  )
  return normalizeVersion(version)
}

export async function rollbackVersion(
  id: string,
  versionNumber: number,
  nit: string,
): Promise<TemplateVersion> {
  return useMocks
    ? rollbackVersionMock(id, versionNumber)
    : rollbackVersionApi(id, versionNumber, nit)
}

/** Version loaded in the editor: open draft, else live published, else highest number. */
export function getLatestVersion(bundle: TemplateBundle): TemplateVersion {
  const sorted = [...bundle.versions].sort((a, b) => b.versionNumber - a.versionNumber)
  const draft = sorted.find((v) => versionStatusOf(v) === 'draft')
  if (draft) return draft
  const published = sorted.find((v) => versionStatusOf(v) === 'published')
  if (published) return published
  return sorted[0]
}

export function describeTemplateStatus(template: Template): string {
  const published = template.publishedVersionNumber ?? 0
  if (template.hasDraft) {
    if (published > 0) {
      return `Publicada v${published} · borrador v${template.currentVersionNumber}`
    }
    return `Borrador · v${template.currentVersionNumber}`
  }
  if (template.status === 'published' && published > 0) {
    return `Publicada · v${published}`
  }
  return `Borrador · v${template.currentVersionNumber}`
}

export { isUsingMocks } from './apiBase'

export type GeneratePdfByCufeInput = {
  nit: string
  cufe: string
  documentType?: string
}

export type GeneratePdfByCufeResult = {
  nit: string
  cufe: string
  documentType: string | number
  templateId: string
  templateVersion: number
  contentType: string
  fileName: string
  pdfBase64: string
}

export async function generatePdfByCufe(
  input: GeneratePdfByCufeInput,
): Promise<GeneratePdfByCufeResult> {
  if (useMocks) {
    throw new Error(
      'Para generar PDF configura VITE_USE_MOCKS=false y VITE_API_URL apuntando a la API.',
    )
  }

  const result = await apiFetch<GeneratePdfByCufeResult>('/pdf/by-cufe', {
    method: 'POST',
    body: JSON.stringify({
      nit: input.nit.trim(),
      cufe: input.cufe.trim(),
      documentType: input.documentType ?? 'factura',
    }),
  })

  if (!result?.pdfBase64) {
    throw new Error('La API no devolvió el PDF.')
  }

  return result
}

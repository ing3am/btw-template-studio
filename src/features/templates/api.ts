import { createBlankBundle, createSeedBundles } from './seed'
import type {
  CreateTemplateInput,
  SaveDraftInput,
  Template,
  TemplateBundle,
  TemplateVersion,
} from './types'

/** Bumped after merge: DIAN labels (main) + Seis Amazonas builder (local). */
const STORAGE_KEY = 'btw-template-studio.templates.v21'

const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

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

function latestVersion(bundle: TemplateBundle): TemplateVersion {
  return [...bundle.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0]
}

function authHeaders(): HeadersInit {
  try {
    const raw = localStorage.getItem('btw-template-studio.auth.v1')
    if (!raw) return {}
    const session = JSON.parse(raw) as { token?: string }
    if (!session?.token) return {}
    return { Authorization: `Bearer ${session.token}` }
  } catch {
    return {}
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBase) {
    throw new Error('VITE_API_URL no está configurada.')
  }

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

function normalizeTemplate(raw: Template & { updatedAt: string | Date }): Template {
  return {
    id: String(raw.id),
    name: raw.name,
    documentType: raw.documentType,
    status: raw.status,
    currentVersionNumber: raw.currentVersionNumber,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date(raw.updatedAt).toISOString(),
  }
}

function normalizeVersion(raw: TemplateVersion & { createdAt: string | Date }): TemplateVersion {
  return {
    id: String(raw.id),
    templateId: String(raw.templateId),
    versionNumber: raw.versionNumber,
    html: raw.html ?? '',
    css: raw.css ?? '',
    schemaJson: raw.schemaJson ?? '{}',
    sampleDataJson: raw.sampleDataJson ?? '{}',
    blocksJson: raw.blocksJson ?? '[]',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(raw.createdAt).toISOString(),
    isPublished: Boolean(raw.isPublished),
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

async function listTemplatesMock(): Promise<Template[]> {
  await delay()
  return readStore()
    .map((bundle) => bundle.template)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function getTemplateBundleMock(id: string): Promise<TemplateBundle> {
  await delay()
  const bundle = readStore().find((item) => item.template.id === id)
  if (!bundle) {
    throw new Error('No encontramos esa plantilla.')
  }
  return bundle
}

async function createTemplateMock(input: CreateTemplateInput): Promise<Template> {
  await delay()
  const bundles = readStore()
  const bundle = createBlankBundle(input.name, input.documentType)
  writeStore([bundle, ...bundles])
  return bundle.template
}

async function saveDraftMock(id: string, input: SaveDraftInput): Promise<TemplateVersion> {
  await delay()
  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) {
    throw new Error('No encontramos esa plantilla.')
  }

  const bundle = bundles[index]
  const current = latestVersion(bundle)
  const createdAt = new Date().toISOString()

  // After publish, next save opens a new draft version (v+1).
  if (current.isPublished || bundle.template.status === 'published') {
    const draftVersion: TemplateVersion = {
      id: crypto.randomUUID(),
      templateId: id,
      versionNumber: current.versionNumber + 1,
      ...input,
      createdAt,
      isPublished: false,
    }
    bundles[index] = {
      template: {
        ...bundle.template,
        status: 'draft',
        updatedAt: createdAt,
      },
      versions: [draftVersion, ...bundle.versions],
    }
    writeStore(bundles)
    return draftVersion
  }

  const updatedVersion: TemplateVersion = {
    ...current,
    ...input,
    createdAt,
    isPublished: false,
  }

  const nextBundle: TemplateBundle = {
    template: {
      ...bundle.template,
      status: 'draft',
      updatedAt: updatedVersion.createdAt,
    },
    versions: [
      updatedVersion,
      ...bundle.versions.filter((version) => version.id !== current.id),
    ],
  }

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
  const current = latestVersion(bundle)
  const publishedAt = new Date().toISOString()
  const publishedVersion: TemplateVersion = {
    ...current,
    versionNumber: current.isPublished ? current.versionNumber + 1 : current.versionNumber,
    id: current.isPublished ? crypto.randomUUID() : current.id,
    createdAt: publishedAt,
    isPublished: true,
  }

  const nextBundle: TemplateBundle = {
    template: {
      ...bundle.template,
      status: 'published',
      currentVersionNumber: publishedVersion.versionNumber,
      updatedAt: publishedAt,
    },
    versions: [
      publishedVersion,
      ...bundle.versions.map((version) => ({ ...version, isPublished: false })),
    ],
  }

  bundles[index] = nextBundle
  writeStore(bundles)
  return publishedVersion
}

async function listTemplatesApi(): Promise<Template[]> {
  const items = await apiFetch<Array<Template & { updatedAt: string }>>('/api/v1/templates')
  return items.map(normalizeTemplate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function getTemplateBundleApi(id: string): Promise<TemplateBundle> {
  const bundle = await apiFetch<{
    template: Template & { updatedAt: string }
    versions: Array<TemplateVersion & { createdAt: string }>
  }>(`/api/v1/templates/${id}`)
  return normalizeBundle(bundle)
}

async function createTemplateApi(input: CreateTemplateInput): Promise<Template> {
  const blank = createBlankBundle(input.name, input.documentType)
  const version = blank.versions[0]
  const created = await apiFetch<Template & { updatedAt: string }>('/api/v1/templates', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      documentType: input.documentType,
      nit: '900000000',
      sectorSalud: false,
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

async function saveDraftApi(id: string, input: SaveDraftInput): Promise<TemplateVersion> {
  const version = await apiFetch<TemplateVersion & { createdAt: string }>(
    `/api/v1/templates/${id}/draft`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
  return normalizeVersion(version)
}

async function publishTemplateApi(id: string): Promise<TemplateVersion> {
  const version = await apiFetch<TemplateVersion & { createdAt: string }>(
    `/api/v1/templates/${id}/publish`,
    { method: 'POST' },
  )
  return normalizeVersion(version)
}

export async function listTemplates(): Promise<Template[]> {
  return useMocks ? listTemplatesMock() : listTemplatesApi()
}

export async function getTemplateBundle(id: string): Promise<TemplateBundle> {
  return useMocks ? getTemplateBundleMock(id) : getTemplateBundleApi(id)
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  return useMocks ? createTemplateMock(input) : createTemplateApi(input)
}

export async function saveDraft(id: string, input: SaveDraftInput): Promise<TemplateVersion> {
  return useMocks ? saveDraftMock(id, input) : saveDraftApi(id, input)
}

export async function publishTemplate(id: string): Promise<TemplateVersion> {
  return useMocks ? publishTemplateMock(id) : publishTemplateApi(id)
}

export function getLatestVersion(bundle: TemplateBundle): TemplateVersion {
  return latestVersion(bundle)
}

export function isUsingMocks(): boolean {
  return useMocks
}

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

  const result = await apiFetch<GeneratePdfByCufeResult>('/api/v1/pdf/by-cufe', {
    method: 'POST',
    body: JSON.stringify({
      nit: input.nit.trim(),
      cufe: input.cufe.trim(),
      documentType: input.documentType ?? 'factura',
    }),
  })

  if (!result?.pdfBase64) {
    throw new Error('La API no devolvió el PDF en Base64.')
  }

  return result
}

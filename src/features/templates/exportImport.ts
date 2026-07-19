import { migrateTemplateBlocks } from '@/features/visual-builder/migrateBlocks'
import {
  defaultPageSettings,
  parsePageSettingsFromCss,
  type PageSettings,
} from '@/features/visual-builder/pageSettings'
import type { TemplateBlock } from '@/features/visual-builder/types'
import type { TemplateAsset } from './templateAssets'
import type {
  CreateTemplateInput,
  DocumentType,
  SaveDraftInput,
  Template,
  TemplateExportV1,
  TemplateVersion,
} from './types'
import { createTemplate, saveDraft } from './api'

const PRODUCT = 'BTW Template Studio' as const
const DOCUMENT_TYPES: DocumentType[] = ['factura', 'nota_credito', 'nota_debito', 'otro']

export type ParseExportResult =
  | { ok: true; data: TemplateExportV1 }
  | { ok: false; error: string }

export type ImportTemplateResult = {
  template: Template
  warnings: string[]
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function inferSectorSalud(blocksJson: string, sampleDataJson: string): boolean {
  if (blocksJson.includes('Anexo para sector salud')) return true
  try {
    const sample = JSON.parse(sampleDataJson) as Record<string, unknown>
    if (sample && typeof sample === 'object') {
      if ('sectorSalud' in sample && sample.sectorSalud === true) return true
      if ('salud' in sample || 'camposSalud' in sample) return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/** Prefer embedded data URLs so the file round-trips without brand library. */
export function serializeAssetsJsonForExport(assets: TemplateAsset[]): string {
  return JSON.stringify(
    assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
      dataUrl: asset.dataUrl,
      createdAt: asset.createdAt,
    })),
  )
}

export function assetsExportHasBrokenBrandRefs(assetsJson?: string): boolean {
  if (!assetsJson?.trim() || assetsJson.trim() === '[]') return false
  try {
    const parsed = JSON.parse(assetsJson) as Array<{ id?: string; dataUrl?: string }>
    if (!Array.isArray(parsed) || parsed.length === 0) return false
    return parsed.some((item) => {
      if (!item?.id) return false
      const url = String(item.dataUrl || '')
      return !url.startsWith('data:')
    })
  } catch {
    return false
  }
}

function migrateBlocksJson(blocksJson: string): string {
  if (!blocksJson.trim()) return '[]'
  try {
    const parsed = JSON.parse(blocksJson) as unknown
    if (!Array.isArray(parsed)) return blocksJson
    const migrated = migrateTemplateBlocks(parsed as TemplateBlock[])
    return JSON.stringify(migrated)
  } catch {
    return blocksJson
  }
}

export function buildTemplateExport(options: {
  name: string
  documentType: DocumentType
  version: Pick<
    TemplateVersion,
    'html' | 'css' | 'schemaJson' | 'sampleDataJson' | 'blocksJson' | 'assetsJson'
  >
  sectorSalud?: boolean
  page?: PageSettings
  assets?: TemplateAsset[]
}): TemplateExportV1 {
  const { version } = options
  const assetsJson =
    options.assets && options.assets.length > 0
      ? serializeAssetsJsonForExport(options.assets)
      : (version.assetsJson ?? '[]')
  const page =
    options.page ??
    (version.css ? parsePageSettingsFromCss(version.css) : defaultPageSettings())
  const sectorSalud =
    options.sectorSalud ??
    inferSectorSalud(version.blocksJson ?? '[]', version.sampleDataJson ?? '{}')

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    product: PRODUCT,
    template: {
      name: options.name.trim() || 'Plantilla importada',
      documentType: options.documentType,
      sectorSalud,
    },
    version: {
      html: version.html ?? '',
      css: version.css ?? '',
      schemaJson: version.schemaJson ?? '{}',
      sampleDataJson: version.sampleDataJson ?? '{}',
      blocksJson: version.blocksJson ?? '[]',
      assetsJson,
      page: page as unknown as Record<string, unknown>,
    },
  }
}

export function parseTemplateExport(raw: unknown): ParseExportResult {
  if (!isRecord(raw)) {
    return { ok: false, error: 'El archivo no es un JSON de plantilla válido.' }
  }

  const schemaVersion = raw.schemaVersion
  if (schemaVersion !== 1) {
    return {
      ok: false,
      error: 'Versión de esquema no soportada. Se espera schemaVersion: 1.',
    }
  }

  if (!isRecord(raw.template) || !isRecord(raw.version)) {
    return {
      ok: false,
      error: 'Faltan las secciones template o version en el archivo.',
    }
  }

  const name = asString(raw.template.name).trim()
  if (!name) {
    return { ok: false, error: 'La plantilla exportada no tiene nombre.' }
  }

  const documentType = raw.template.documentType
  if (typeof documentType !== 'string' || !DOCUMENT_TYPES.includes(documentType as DocumentType)) {
    return { ok: false, error: 'El tipo documental de la plantilla no es válido.' }
  }

  const version = raw.version
  const html = asString(version.html)
  const css = asString(version.css)
  const schemaJson = asString(version.schemaJson, '{}')
  const sampleDataJson = asString(version.sampleDataJson, '{}')
  const blocksJson = asString(version.blocksJson, '[]')

  if (!html.trim() && !blocksJson.trim()) {
    return {
      ok: false,
      error: 'La exportación no incluye HTML ni bloques para importar.',
    }
  }

  const sectorSalud =
    typeof raw.template.sectorSalud === 'boolean'
      ? raw.template.sectorSalud
      : inferSectorSalud(blocksJson, sampleDataJson)

  const assetsJson =
    typeof version.assetsJson === 'string' ? version.assetsJson : undefined
  const page = isRecord(version.page) ? version.page : undefined

  const data: TemplateExportV1 = {
    schemaVersion: 1,
    exportedAt: asString(raw.exportedAt, new Date().toISOString()),
    product: PRODUCT,
    template: {
      name,
      documentType: documentType as DocumentType,
      sectorSalud,
    },
    version: {
      html,
      css,
      schemaJson,
      sampleDataJson,
      blocksJson,
      assetsJson,
      page,
    },
  }

  return { ok: true, data }
}

export function downloadTemplateExport(payload: TemplateExportV1): void {
  const slug = slugify(payload.template.name) || 'plantilla'
  const filename = `${slug}.btw-template.json`
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function prepareImportDraft(payload: TemplateExportV1): {
  createInput: Omit<CreateTemplateInput, 'nit'>
  draft: SaveDraftInput
  warnings: string[]
} {
  const warnings: string[] = []
  const blocksJson = migrateBlocksJson(payload.version.blocksJson)
  const assetsJson = payload.version.assetsJson ?? '[]'

  if (assetsExportHasBrokenBrandRefs(assetsJson)) {
    warnings.push(
      'Algunas imágenes apuntan a la biblioteca de marca y pueden no verse hasta que las vuelvas a subir.',
    )
  }

  return {
    createInput: {
      name: payload.template.name,
      documentType: payload.template.documentType,
      sectorSalud: payload.template.sectorSalud ?? false,
    },
    draft: {
      status: 'draft',
      html: payload.version.html,
      css: payload.version.css,
      schemaJson: payload.version.schemaJson,
      sampleDataJson: payload.version.sampleDataJson,
      blocksJson,
      assetsJson,
    },
    warnings,
  }
}

export async function importTemplateFromExport(
  payload: TemplateExportV1,
  nit: string,
): Promise<ImportTemplateResult> {
  const prepared = prepareImportDraft(payload)
  const template = await createTemplate({
    ...prepared.createInput,
    nit,
  })
  await saveDraft(template.id, prepared.draft, nit)
  return { template, warnings: prepared.warnings }
}

export async function readTemplateExportFile(file: File): Promise<ParseExportResult> {
  if (!file.name.toLowerCase().endsWith('.json')) {
    return { ok: false, error: 'Selecciona un archivo .json de plantilla.' }
  }
  try {
    const text = await file.text()
    const raw = JSON.parse(text) as unknown
    return parseTemplateExport(raw)
  } catch {
    return { ok: false, error: 'No pudimos leer el archivo JSON.' }
  }
}

import type { PageSettings } from '@/features/visual-builder/pageSettings'
import type { TemplateBlock } from '@/features/visual-builder/types'

/** Feature flags stored with a published template. */
export type TemplateFeatures = {
  sectorSalud: boolean
}

/** Binary asset metadata (bytes live in blob/storage, not in blocks). */
export type TemplateAssetRef = {
  id: string
  role: 'logo' | 'image' | 'other'
  mime: string
  /** Backend storage key; studio may use dataUrl locally instead */
  storageKey?: string
  name?: string
}

/**
 * Canonical published configuration for PDF generation.
 * Editor sample data is NOT part of this contract.
 */
export type TemplateDefinition = {
  templateId: string
  nit: string
  documentType: 'factura' | 'nota_credito' | 'nota_debito' | 'otro'
  version: number
  status: 'draft' | 'published'
  page: PageSettings
  features: TemplateFeatures
  blocks: TemplateBlock[]
  assets: TemplateAssetRef[]
  updatedAt: string
}

export function defaultTemplateFeatures(
  partial?: Partial<TemplateFeatures>,
): TemplateFeatures {
  return {
    sectorSalud: partial?.sectorSalud ?? false,
  }
}

export function buildTemplateDefinition(input: {
  templateId: string
  nit: string
  documentType?: TemplateDefinition['documentType']
  version?: number
  status?: TemplateDefinition['status']
  page: PageSettings
  features?: Partial<TemplateFeatures>
  blocks: TemplateBlock[]
  assets?: TemplateAssetRef[]
}): TemplateDefinition {
  return {
    templateId: input.templateId,
    nit: input.nit,
    documentType: input.documentType ?? 'factura',
    version: input.version ?? 1,
    status: input.status ?? 'draft',
    page: input.page,
    features: defaultTemplateFeatures(input.features),
    blocks: input.blocks,
    assets: input.assets ?? [],
    updatedAt: new Date().toISOString(),
  }
}

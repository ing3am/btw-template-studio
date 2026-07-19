import { createDefaultFacturaBlocks } from '@/features/visual-builder/types'
import { serializeBlocksToDocument } from '@/features/visual-builder/serializeToHtml'
import { defaultPageSettings } from '@/features/visual-builder/pageSettings'
import {
  buildGenericEditorSample,
  GENERIC_EDITOR_SCHEMA,
} from './genericSample'
import { buildTemplateDefinition } from './templateDefinition'
import type { TemplateBundle } from './types'

const DEFAULT_NIT = '900000000'
const DEFAULT_SECTOR_SALUD = false

function now() {
  return new Date().toISOString()
}

function buildVersion(templateId: string, versionId: string) {
  const page = defaultPageSettings()
  const blocks = createDefaultFacturaBlocks({
    sectorSalud: DEFAULT_SECTOR_SALUD,
    defaultFontSizeLarge: page.defaultFontSizeLarge,
    defaultFontSizeSmall: page.defaultFontSizeSmall,
  })
  const { html, css } = serializeBlocksToDocument(blocks, page)
  const sample = buildGenericEditorSample({
    sectorSalud: DEFAULT_SECTOR_SALUD,
    company: {
      razonSocial: 'EMPRESA DEMO S.A.S.',
      nit: `${DEFAULT_NIT}-1`,
    },
  })

  // Published-shape snapshot for backend alignment (not required by local storage yet)
  void buildTemplateDefinition({
    templateId,
    nit: DEFAULT_NIT,
    page,
    features: { sectorSalud: DEFAULT_SECTOR_SALUD },
    blocks,
    status: 'draft',
  })

  return {
    id: versionId,
    templateId,
    versionNumber: 1,
    html,
    css,
    schemaJson: GENERIC_EDITOR_SCHEMA,
    sampleDataJson: JSON.stringify(sample, null, 2),
    blocksJson: JSON.stringify(blocks),
    createdAt: now(),
    isPublished: false,
    status: 'draft' as const,
  }
}

export function createSeedBundles(): TemplateBundle[] {
  const templateId = 'factura-electronica-demo'
  return [
    {
      template: {
        id: templateId,
        name: 'Factura electrónica (plantilla demo)',
        documentType: 'factura',
        status: 'draft',
        currentVersionNumber: 1,
        publishedVersionNumber: 0,
        hasDraft: true,
        updatedAt: now(),
      },
      versions: [buildVersion(templateId, crypto.randomUUID())],
    },
  ]
}

export function createBlankBundle(
  name: string,
  documentType: TemplateBundle['template']['documentType'],
  options?: { nit?: string; sectorSalud?: boolean },
): TemplateBundle {
  const templateId = crypto.randomUUID()
  const sectorSalud = options?.sectorSalud ?? DEFAULT_SECTOR_SALUD
  const nit = options?.nit ?? DEFAULT_NIT
  const page = defaultPageSettings()
  const blocks = createDefaultFacturaBlocks({
    sectorSalud,
    defaultFontSizeLarge: page.defaultFontSizeLarge,
    defaultFontSizeSmall: page.defaultFontSizeSmall,
  })
  const { html, css } = serializeBlocksToDocument(blocks, page)
  const sample = buildGenericEditorSample({
    sectorSalud,
    company: {
      nit,
    },
  })
  const createdAt = now()

  return {
    template: {
      id: templateId,
      name,
      documentType,
      status: 'draft',
      currentVersionNumber: 1,
      publishedVersionNumber: 0,
      hasDraft: true,
      updatedAt: createdAt,
      nit,
    },
    versions: [
      {
        id: crypto.randomUUID(),
        templateId,
        versionNumber: 1,
        html,
        css,
        schemaJson: GENERIC_EDITOR_SCHEMA,
        sampleDataJson: JSON.stringify(sample, null, 2),
        blocksJson: JSON.stringify(blocks),
        createdAt,
        isPublished: false,
        status: 'draft',
      },
    ],
  }
}

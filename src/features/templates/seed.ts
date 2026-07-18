import { createDefaultFacturaBlocks } from '@/features/visual-builder/types'
import { serializeBlocksToDocument } from '@/features/visual-builder/serializeToHtml'
import { defaultPageSettings } from '@/features/visual-builder/pageSettings'
import {
  DIAN_SAMPLE_DATA_JSON,
  DIAN_SCHEMA_JSON,
} from '@/features/visual-builder/dianSampleData'
import type { TemplateBundle } from './types'

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
    schemaJson: DIAN_SCHEMA_JSON,
    sampleDataJson: DIAN_SAMPLE_DATA_JSON,
    blocksJson: JSON.stringify(blocks),
    createdAt: now(),
    isPublished: false,
  }
}

export function createSeedBundles(): TemplateBundle[] {
  const templateId = 'factura-electronica'
  return [
    {
      template: {
        id: templateId,
        name: 'Factura electrónica',
        documentType: 'factura',
        status: 'draft',
        currentVersionNumber: 1,
        updatedAt: now(),
      },
      versions: [buildVersion(templateId, 'ver-factura-1')],
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

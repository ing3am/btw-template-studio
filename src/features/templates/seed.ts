import { createDefaultFacturaBlocks } from '@/features/visual-builder/types'
import { serializeBlocksToDocument } from '@/features/visual-builder/serializeToHtml'
import { defaultPageSettings } from '@/features/visual-builder/pageSettings'
import type { TemplateBundle } from './types'

const DEFAULT_SCHEMA = `{
  "type": "object",
  "required": ["numero", "emisor", "cliente", "items", "totales"]
}`

const DEFAULT_SAMPLE = `{
  "numero": "FE-2026-00123",
  "emisor": {
    "razonSocial": "BTW Soluciones S.A.S.",
    "nit": "900123456-1"
  },
  "cliente": {
    "nombre": "Comercial Andina Ltda.",
    "nit": "800987654-3",
    "ciudad": "Bogotá D.C."
  },
  "items": [
    {
      "descripcion": "Licencia plataforma documentos electrónicos",
      "cantidad": 1,
      "valor": 1200000
    },
    {
      "descripcion": "Soporte mensual",
      "cantidad": 1,
      "valor": 250000
    }
  ],
  "totales": {
    "subtotal": 1450000,
    "iva": 275500,
    "total": 1725500
  }
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
    schemaJson: DEFAULT_SCHEMA,
    sampleDataJson: DEFAULT_SAMPLE,
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

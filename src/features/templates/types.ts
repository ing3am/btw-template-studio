export type TemplateStatus = 'draft' | 'published'

export type VersionStatus = 'draft' | 'published' | 'used'

export type DocumentType = 'factura' | 'nota_credito' | 'nota_debito' | 'otro'

export type TemplateVersion = {
  id: string
  templateId: string
  versionNumber: number
  html: string
  css: string
  schemaJson: string
  sampleDataJson: string
  blocksJson: string
  /** Embedded images as JSON array ({ id, name, mime, dataUrl }). */
  assetsJson?: string
  createdAt: string
  isPublished: boolean
  /** draft | published | used */
  status?: VersionStatus
}

export type Template = {
  id: string
  name: string
  documentType: DocumentType
  status: TemplateStatus
  /** Tip version (what the editor loads). */
  currentVersionNumber: number
  /** Live version used for new PDFs; 0 if never published. */
  publishedVersionNumber?: number
  /** Tip is an unpublished draft while a published version may still exist. */
  hasDraft?: boolean
  updatedAt: string
  nit?: string
}

export type TemplateBundle = {
  template: Template
  versions: TemplateVersion[]
}

export type CreateTemplateInput = {
  name: string
  documentType: DocumentType
  nit: string
  sectorSalud?: boolean
}

export type SaveDraftInput = {
  /** `draft` = guardar contenido; `published` = publicar tip actual (contenido opcional). */
  status?: TemplateStatus
  html?: string
  css?: string
  schemaJson?: string
  sampleDataJson?: string
  blocksJson?: string
  assetsJson?: string
}

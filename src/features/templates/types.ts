export type TemplateStatus = 'draft' | 'published'

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
}

export type Template = {
  id: string
  name: string
  documentType: DocumentType
  status: TemplateStatus
  currentVersionNumber: number
  updatedAt: string
}

export type TemplateBundle = {
  template: Template
  versions: TemplateVersion[]
}

export type CreateTemplateInput = {
  name: string
  documentType: DocumentType
}

export type SaveDraftInput = {
  html: string
  css: string
  schemaJson: string
  sampleDataJson: string
  blocksJson: string
  assetsJson?: string
}

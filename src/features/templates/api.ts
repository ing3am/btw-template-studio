import { createBlankBundle, createSeedBundles } from './seed'
import type {
  CreateTemplateInput,
  SaveDraftInput,
  Template,
  TemplateBundle,
  TemplateVersion,
} from './types'

const STORAGE_KEY = 'btw-template-studio.templates.v7'

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

export async function listTemplates(): Promise<Template[]> {
  await delay()
  return readStore()
    .map((bundle) => bundle.template)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getTemplateBundle(id: string): Promise<TemplateBundle> {
  await delay()
  const bundle = readStore().find((item) => item.template.id === id)
  if (!bundle) {
    throw new Error('No encontramos esa plantilla.')
  }
  return bundle
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  await delay()
  const bundles = readStore()
  const bundle = createBlankBundle(input.name, input.documentType)
  writeStore([bundle, ...bundles])
  return bundle.template
}

export async function saveDraft(id: string, input: SaveDraftInput): Promise<TemplateVersion> {
  await delay()
  const bundles = readStore()
  const index = bundles.findIndex((item) => item.template.id === id)
  if (index < 0) {
    throw new Error('No encontramos esa plantilla.')
  }

  const bundle = bundles[index]
  const current = latestVersion(bundle)
  const updatedVersion: TemplateVersion = {
    ...current,
    ...input,
    createdAt: new Date().toISOString(),
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

export async function publishTemplate(id: string): Promise<TemplateVersion> {
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

export function getLatestVersion(bundle: TemplateBundle): TemplateVersion {
  return latestVersion(bundle)
}

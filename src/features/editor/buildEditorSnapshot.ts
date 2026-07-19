import {
  serializeAssetsJson,
  type TemplateAsset,
} from '@/features/templates/templateAssets'
import type { TemplateBlock } from '@/features/visual-builder/types'

export type EditorSnapshotInput = {
  blocks: TemplateBlock[]
  html: string
  css: string
  schemaJson: string
  sampleDataJson: string
  assets: TemplateAsset[]
}

/** Stable JSON string for compare; invalid JSON kept as trimmed raw. */
export function canonicalizeJsonString(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    return JSON.stringify(JSON.parse(trimmed))
  } catch {
    return trimmed
  }
}

/**
 * Canonical string of what the editor persists on save.
 * Same serialization on hydrate, edits, and post-save baseline.
 */
export function buildEditorSnapshot(input: EditorSnapshotInput): string {
  return JSON.stringify({
    blocksJson: JSON.stringify(input.blocks),
    html: input.html,
    css: input.css,
    schemaJson: canonicalizeJsonString(input.schemaJson),
    sampleDataJson: canonicalizeJsonString(input.sampleDataJson),
    assetsJson: serializeAssetsJson(input.assets),
  })
}

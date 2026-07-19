/** Template-scoped asset refs. Binaries live in brand library; draft only sends ids. */

import { brandAssetAbsoluteUrl } from './brandAssetsApi'

export type TemplateAsset = {
  id: string
  templateId: string
  name: string
  mime: string
  /** Preview URL: brand content endpoint or data URL (legacy). */
  dataUrl: string
  createdAt: string
}

export function parseAssetsJson(
  templateId: string,
  assetsJson?: string | null,
): TemplateAsset[] {
  if (!templateId || !assetsJson?.trim() || assetsJson.trim() === '[]') return []
  try {
    const parsed = JSON.parse(assetsJson) as Array<{
      id?: string
      name?: string
      mime?: string
      dataUrl?: string
      createdAt?: string
    }>
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item?.id)
      .map((item) => {
        const id = String(item.id)
        const dataUrl = item.dataUrl
          ? String(item.dataUrl)
          : brandAssetAbsoluteUrl(`/api/v1/brand-assets/${id}/content`)
        return {
          id,
          templateId,
          name: item.name || 'imagen',
          mime: item.mime || 'image/png',
          dataUrl,
          createdAt: item.createdAt || new Date().toISOString(),
        }
      })
  } catch {
    return []
  }
}

/** Draft payload: ids only (no Base64) to avoid Request Entity Too Large. */
export function serializeAssetsJson(assets: TemplateAsset[]): string {
  return JSON.stringify(
    assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
    })),
  )
}

export function assetMapFromList(assets: TemplateAsset[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const asset of assets) {
    map[asset.id] = asset.dataUrl
  }
  return map
}

export function qrImageUrlFromPayload(payload: string, size = 200): string {
  const data = payload.trim()
  if (!data) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`
}

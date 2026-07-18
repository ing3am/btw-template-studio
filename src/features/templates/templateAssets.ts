/** Template-scoped binary assets (logos, etc.). Source of truth is the API (AssetsJson). */

export type TemplateAsset = {
  id: string
  templateId: string
  name: string
  mime: string
  dataUrl: string
  createdAt: string
}

const MAX_BYTES = 1.5 * 1024 * 1024

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
      .filter((item) => item?.id && item?.dataUrl)
      .map((item) => ({
        id: String(item.id),
        templateId,
        name: item.name || 'imagen',
        mime: item.mime || 'image/png',
        dataUrl: String(item.dataUrl),
        createdAt: item.createdAt || new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

export function serializeAssetsJson(assets: TemplateAsset[]): string {
  return JSON.stringify(
    assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
      dataUrl: asset.dataUrl,
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

export async function createTemplateAssetFromFile(
  templateId: string,
  file: File,
): Promise<TemplateAsset> {
  if (!templateId) throw new Error('Falta el id de la plantilla.')
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen supera 1.5 MB. Usa un archivo más liviano.')
  }

  const dataUrl = await readFileAsDataUrl(file)
  return {
    id: crypto.randomUUID(),
    templateId,
    name: file.name || 'imagen',
    mime: file.type || 'image/png',
    dataUrl,
    createdAt: new Date().toISOString(),
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

export function qrImageUrlFromPayload(payload: string, size = 200): string {
  const data = payload.trim()
  if (!data) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`
}

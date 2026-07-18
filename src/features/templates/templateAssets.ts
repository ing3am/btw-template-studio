/** Template-scoped binary assets (logos, etc.). Avoids one DB column per image. */

export type TemplateAsset = {
  id: string
  templateId: string
  name: string
  mime: string
  /** Studio preview payload; backend would use storageKey instead */
  dataUrl: string
  createdAt: string
}

const STORAGE_KEY = 'btw-template-studio.assets.v1'
const MAX_BYTES = 1.5 * 1024 * 1024

type AssetStore = Record<string, TemplateAsset[]>

function readStore(): AssetStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AssetStore
  } catch {
    return {}
  }
}

function writeStore(store: AssetStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function listTemplateAssets(templateId: string): TemplateAsset[] {
  if (!templateId) return []
  return readStore()[templateId] ?? []
}

export function getTemplateAsset(
  templateId: string,
  assetId: string,
): TemplateAsset | undefined {
  return listTemplateAssets(templateId).find((item) => item.id === assetId)
}

export function assetMapForTemplate(
  templateId: string,
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const asset of listTemplateAssets(templateId)) {
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
  const asset: TemplateAsset = {
    id: crypto.randomUUID(),
    templateId,
    name: file.name || 'imagen',
    mime: file.type || 'image/png',
    dataUrl,
    createdAt: new Date().toISOString(),
  }

  const store = readStore()
  const list = store[templateId] ?? []
  store[templateId] = [asset, ...list]
  writeStore(store)
  return asset
}

export function deleteTemplateAsset(templateId: string, assetId: string) {
  const store = readStore()
  const list = store[templateId] ?? []
  store[templateId] = list.filter((item) => item.id !== assetId)
  writeStore(store)
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

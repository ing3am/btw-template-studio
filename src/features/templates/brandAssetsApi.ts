import { authHeaders, getApiBase, isUsingMocks } from './apiBase'

export const BRAND_ASSET_MAX_BYTES = 1.5 * 1024 * 1024
export const BRAND_ASSET_MAX_COUNT = 5

export type BrandAsset = {
  id: string
  nit: string
  name: string
  mime: string
  sizeBytes: number
  createdAt: string
  contentUrl: string
}

const MOCK_KEY = 'btw-template-studio.brand-assets.v1'

function readMock(): BrandAsset[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BrandAsset[]
  } catch {
    return []
  }
}

function writeMock(items: BrandAsset[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(items))
}

export function brandAssetAbsoluteUrl(contentUrl: string): string {
  if (!contentUrl) return ''
  if (contentUrl.startsWith('data:') || contentUrl.startsWith('blob:')) return contentUrl
  if (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) return contentUrl
  const base = getApiBase()
  return `${base}${contentUrl.startsWith('/') ? contentUrl : `/${contentUrl}`}`
}

export async function listBrandAssets(nit?: string): Promise<BrandAsset[]> {
  if (isUsingMocks()) {
    const all = readMock()
    if (!nit) return all
    const digits = nit.replace(/\D/g, '')
    return all.filter((item) => item.nit === digits || item.nit === nit)
  }

  const base = getApiBase()
  const qs = nit ? `?nit=${encodeURIComponent(nit)}` : ''
  const response = await fetch(`${base}/api/v1/brand-assets${qs}`, {
    headers: { ...authHeaders() },
  })
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`)
  return (await response.json()) as BrandAsset[]
}

export async function uploadBrandAsset(file: File, nit?: string): Promise<BrandAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.')
  }
  if (file.size > BRAND_ASSET_MAX_BYTES) {
    throw new Error('La imagen supera 1.5 MB. Usa un archivo más liviano.')
  }

  if (isUsingMocks()) {
    const companyNit = (nit || '900000000').replace(/\D/g, '') || '900000000'
    const existing = readMock().filter((item) => item.nit === companyNit)
    if (existing.length >= BRAND_ASSET_MAX_COUNT) {
      throw new Error(
        `Máximo ${BRAND_ASSET_MAX_COUNT} imágenes por empresa. Elimina una para subir otra.`,
      )
    }
    const dataUrl = await readFileAsDataUrl(file)
    const asset: BrandAsset = {
      id: crypto.randomUUID(),
      nit: companyNit,
      name: file.name || 'imagen',
      mime: file.type || 'image/png',
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      contentUrl: dataUrl,
    }
    writeMock([asset, ...readMock()])
    return asset
  }

  const base = getApiBase()
  const body = new FormData()
  body.append('file', file)
  if (nit) body.append('nit', nit)

  const response = await fetch(`${base}/api/v1/brand-assets`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body,
  })
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`
    try {
      const json = (await response.json()) as { message?: string }
      if (json.message) message = json.message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return (await response.json()) as BrandAsset
}

export async function deleteBrandAsset(id: string): Promise<void> {
  if (isUsingMocks()) {
    writeMock(readMock().filter((item) => item.id !== id))
    return
  }

  const base = getApiBase()
  const response = await fetch(`${base}/api/v1/brand-assets/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!response.ok && response.status !== 204) {
    throw new Error(`Error HTTP ${response.status}`)
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

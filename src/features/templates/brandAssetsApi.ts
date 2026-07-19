import { authHeaders, getApiBase, isUsingMocks } from './apiBase'
import { getSessionNit } from '@/features/auth/api'
import { withNetworkActivity } from '@/shared/lib/networkActivity'

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
  let path = contentUrl.startsWith('/') ? contentUrl : `/${contentUrl}`
  // VITE_API_URL may already include /api/v1; backend contentUrl often starts with /api/v1/...
  if (base.endsWith('/api/v1') && path.startsWith('/api/v1/')) {
    path = path.slice('/api/v1'.length)
  }
  return `${base}${path}`
}

export async function listBrandAssets(nit?: string): Promise<BrandAsset[]> {
  const companyNit = (nit || getSessionNit()).replace(/\D/g, '')
  if (isUsingMocks()) {
    const all = readMock()
    return all.filter((item) => item.nit === companyNit)
  }

  const base = getApiBase()
  const qs = `?nit=${encodeURIComponent(companyNit)}`
  return withNetworkActivity(async () => {
    const response = await fetch(`${base}/brand-assets${qs}`, {
      headers: { ...authHeaders() },
    })
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`)
    return (await response.json()) as BrandAsset[]
  })
}

export async function uploadBrandAsset(file: File, nit?: string): Promise<BrandAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.')
  }
  if (file.size > BRAND_ASSET_MAX_BYTES) {
    throw new Error('La imagen supera 1.5 MB. Usa un archivo más liviano.')
  }

  const companyNit = (nit || getSessionNit()).replace(/\D/g, '')

  if (isUsingMocks()) {
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
  body.append('nit', companyNit)

  return withNetworkActivity(async () => {
    const response = await fetch(`${base}/brand-assets`, {
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
  })
}

export async function deleteBrandAsset(id: string): Promise<void> {
  if (isUsingMocks()) {
    writeMock(readMock().filter((item) => item.id !== id))
    return
  }

  const base = getApiBase()
  return withNetworkActivity(async () => {
    const response = await fetch(`${base}/brand-assets/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    if (!response.ok && response.status !== 204) {
      throw new Error(`Error HTTP ${response.status}`)
    }
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

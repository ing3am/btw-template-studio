type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

function walk(value: Json, prefix: string, out: string[], arraysOnly = false) {
  if (value == null) return
  if (Array.isArray(value)) {
    if (prefix) out.push(prefix)
    return
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (Array.isArray(child)) {
        out.push(path)
        continue
      }
      if (child != null && typeof child === 'object') {
        if (!arraysOnly) walk(child, path, out, arraysOnly)
      } else if (!arraysOnly && prefix !== undefined) {
        out.push(path)
      }
    }
  }
}

export function extractJsonPaths(sampleDataJson: string): string[] {
  try {
    const data = JSON.parse(sampleDataJson) as Json
    const paths: string[] = []
    walk(data, '', paths, false)
    return [...new Set(paths.filter((p) => p))].sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

export function extractArrayPaths(sampleDataJson: string): string[] {
  try {
    const data = JSON.parse(sampleDataJson) as Json
    const paths: string[] = []
    walk(data, '', paths, true)
    // also collect arrays via full walk
    const all: string[] = []
    const visit = (value: Json, prefix: string) => {
      if (Array.isArray(value)) {
        if (prefix) all.push(prefix)
        return
      }
      if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          visit(child, prefix ? `${prefix}.${key}` : key)
        }
      }
    }
    visit(data, '')
    return [...new Set(all)].sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

export function extractItemPropertyPaths(
  sampleDataJson: string,
  arrayPath: string,
): string[] {
  try {
    const data = JSON.parse(sampleDataJson) as Json
    const parts = arrayPath.split('.').filter(Boolean)
    let cursor: Json = data
    for (const part of parts) {
      if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return []
      cursor = cursor[part]
    }
    if (!Array.isArray(cursor) || cursor.length === 0) return []
    const first = cursor[0]
    if (!first || typeof first !== 'object' || Array.isArray(first)) return []
    return Object.keys(first).sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

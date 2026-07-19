/** Convert a base64 PDF payload into a blob/file object URL. Caller must revoke. */
export function pdfBase64ToObjectUrl(base64: string, fileName?: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  const payload = fileName?.trim()
    ? new File([bytes], fileName.trim(), { type: 'application/pdf' })
    : new Blob([bytes], { type: 'application/pdf' })
  return URL.createObjectURL(payload)
}

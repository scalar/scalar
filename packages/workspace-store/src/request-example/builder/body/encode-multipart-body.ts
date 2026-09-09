import type { RequestBody } from './build-request-body'

/** Escape disposition parameters using the same percent escapes as browser form submissions. */
const escapeParameter = (value: string): string =>
  value
    .replace(/\r\n|\r|\n/g, '\r\n')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/"/g, '%22')

/**
 * Encode typed text fields without turning them into file uploads.
 * Blob parts retain binary bytes and keep request construction synchronous.
 */
export const encodeMultipartBody = (parts: Extract<RequestBody, { mode: 'formdata' }>['value']): Blob => {
  // getRandomValues also works on HTTP playgrounds, where randomUUID is unavailable.
  const random = crypto.getRandomValues(new Uint8Array(24))
  const boundary = `----scalar-${Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  const chunks: BlobPart[] = parts.flatMap((part): BlobPart[] => {
    const filename = part.type === 'file' ? part.value.name : part.type === 'blob' ? 'blob' : undefined
    const contentType =
      part.contentType ?? (part.type === 'text' ? undefined : part.value.type || 'application/octet-stream')
    // A media type comes from the API description and must never inject part headers.
    if (contentType && /[\r\n\0]/.test(contentType)) {
      throw new Error('Invalid multipart content type')
    }
    const disposition = `Content-Disposition: form-data; name="${escapeParameter(part.key)}"${
      filename === undefined ? '' : `; filename="${escapeParameter(filename)}"`
    }`
    const headers = `--${boundary}\r\n${disposition}\r\n${contentType ? `Content-Type: ${contentType}\r\n` : ''}\r\n`
    // Match native FormData line endings for ordinary text; explicitly typed data keeps its bytes.
    const value = part.type === 'text' && !part.contentType ? part.value.replace(/\r\n|\r|\n/g, '\r\n') : part.value
    return [headers, value, '\r\n']
  })
  return new Blob([...chunks, `--${boundary}--\r\n`], { type: `multipart/form-data; boundary=${boundary}` })
}

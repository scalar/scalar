import { parseMimeType } from '@scalar/helpers/http/mime-type'

import type { MultipartPart } from './build-multipart'
import { MAX_MULTIPART_NESTING } from './multipart-limits'

/** Escape disposition parameters using the same percent escapes as browser form submissions. */
const escapeParameter = (value: string): string =>
  value
    .replace(/\r\n|\r|\n/g, '\r\n')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/"/g, '%22')

/** Serialize nested multipart bodies for both fetch and synchronous code snippets. */
export const serializeMultipartBody = (
  parts: MultipartPart[],
  contentType = 'multipart/form-data',
  replace: (value: string) => string = (value) => value,
  nesting = 0,
): { chunks: BlobPart[]; contentType: string } => {
  if (nesting >= MAX_MULTIPART_NESTING) {
    throw new Error('Maximum multipart nesting exceeded')
  }
  if (/[\r\n\0]/.test(contentType)) {
    throw new Error('Invalid multipart content type')
  }
  const mime = parseMimeType(contentType)
  // getRandomValues also works on HTTP playgrounds, where randomUUID is unavailable.
  const random = crypto.getRandomValues(new Uint8Array(24))
  const boundary = `----scalar-${Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  mime.parameters.set('boundary', boundary)
  const chunks: BlobPart[] = parts.flatMap((part): BlobPart[] => {
    const encoded =
      part.type === 'multipart'
        ? serializeMultipartBody(part.value, part.contentType, replace, nesting + 1)
        : { chunks: [part.type === 'text' ? replace(part.value) : part.value], contentType: part.contentType }
    const filename = part.type === 'file' ? part.value.name : part.type === 'blob' ? 'blob' : undefined
    const partContentType =
      encoded.contentType ??
      (part.type === 'file' || part.type === 'blob' ? part.value.type || 'application/octet-stream' : undefined)
    if (partContentType && /[\r\n\0]/.test(partContentType)) {
      throw new Error('Invalid multipart content type')
    }
    const disposition =
      part.key === undefined
        ? ''
        : `Content-Disposition: form-data; name="${escapeParameter(replace(part.key))}"${
            filename === undefined ? '' : `; filename="${escapeParameter(filename)}"`
          }\r\n`
    const extraHeaders = Object.entries(part.headers ?? {})
      .map(([name, value]) => {
        const resolved = replace(value)
        if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n\0]/.test(resolved)) {
          throw new Error('Invalid multipart header')
        }
        return name.toLowerCase() === 'content-type' ? '' : `${name}: ${resolved}\r\n`
      })
      .join('')
    const headers = `--${boundary}\r\n${disposition}${partContentType ? `Content-Type: ${partContentType}\r\n` : ''}${extraHeaders}\r\n`
    const chunks = encoded.chunks.map((value) =>
      typeof value === 'string' && !part.contentType ? value.replace(/\r\n|\r|\n/g, '\r\n') : value,
    )
    return [headers, ...chunks, '\r\n']
  })
  return { chunks: [...chunks, `--${boundary}--\r\n`], contentType: mime.toString() }
}

/** Encode multipart parts without losing binary bytes or assigning filenames to typed text. */
export const encodeMultipartBody = (
  parts: MultipartPart[],
  contentType = 'multipart/form-data',
  replace?: (value: string) => string,
): Blob => {
  const encoded = serializeMultipartBody(parts, contentType, replace)
  return new Blob(encoded.chunks, { type: encoded.contentType })
}

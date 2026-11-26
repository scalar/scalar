import { extractFilename } from '@scalar/helpers/http/extract-filename'

import { resolveResponseMimeType } from '@/v2/blocks/response-block/helpers/resolve-response-content-type'

const isBlob = (b: any): b is Blob => b instanceof Blob

/**
 * Processes the response body of an HTTP request.
 * Extracts MIME type, attachment filename, and generates a data URL.
 */
export function processResponseBody({ data, headers }: { data: unknown; headers: { name: string; value: string }[] }) {
  const contentType = headers.find((header) => header.name.toLowerCase() === 'content-type')
  const mimeType = resolveResponseMimeType(contentType?.value)
  const contentDisposition = headers.find((header) => header.name.toLowerCase() === 'content-disposition')?.value ?? ''
  const attachmentFilename = extractFilename(contentDisposition)
  const isAttachment = /^\s*attachment\s*(?:;|$)/i.test(contentDisposition)

  const dataUrl = (() => {
    if (data === '') {
      // An empty file can use a reusable URL without registering an object URL.
      return isAttachment ? 'data:application/octet-stream,' : ''
    }
    if (isBlob(data)) {
      return URL.createObjectURL(data)
    }
    if (typeof data === 'string') {
      return URL.createObjectURL(new Blob([data], { type: mimeType ? mimeType.toString() : undefined }))
    }
    if (data instanceof Object && Object.keys(data).length) {
      return URL.createObjectURL(
        new Blob([JSON.stringify(data)], {
          type: mimeType ? mimeType.toString() : undefined,
        }),
      )
    }
    return ''
  })()

  return { mimeType, attachmentFilename, isAttachment, dataUrl }
}

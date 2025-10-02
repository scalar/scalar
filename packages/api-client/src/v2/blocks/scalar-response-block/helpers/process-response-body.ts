import MimeType from 'whatwg-mimetype'

import { extractFilename } from './../helpers/extract-filename'

const isBlob = (b: any): b is Blob => b instanceof Blob

/**
 * Processes the response body of an HTTP request.
 * Extracts MIME type, attachment filename, and generates a data URL.
 */
export function processResponseBody({ data, headers }: { data: unknown; headers: { name: string; value: string }[] }) {
  const mimeType = new MimeType(headers.find((header) => header.name.toLowerCase() === 'content-type')?.value ?? '')
  const attachmentFilename = extractFilename(
    headers.find((header) => header.name.toLowerCase() === 'content-disposition')?.value ?? '',
  )

  const dataUrl = (() => {
    if (isBlob(data)) {
      return URL.createObjectURL(data)
    }
    if (typeof data === 'string') {
      return URL.createObjectURL(new Blob([data], { type: mimeType.toString() }))
    }
    if (data instanceof Object && Object.keys(data).length) {
      return URL.createObjectURL(
        new Blob([JSON.stringify(data)], {
          type: mimeType.toString(),
        }),
      )
    }
    return ''
  })()

  return { mimeType, attachmentFilename, dataUrl }
}

import MimeType from 'whatwg-mimetype'

const decodeURIComponentSafe = (str: string) => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

function extractFilename(contentDisposition: string) {
  let filename = ''

  if (contentDisposition) {
    const fileNameMatch =
      contentDisposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ??
      contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/)?.[1]

    if (fileNameMatch) {
      filename = decodeURIComponentSafe(fileNameMatch.trim())
    }
  }

  return filename
}

const isBlob = (b: any): b is Blob => b instanceof Blob

const getResponseHeaders = (headers?: Record<string, string>) => {
  return headers
    ? Object.keys(headers).map((key) => ({
        name: key,
        value: headers[key] ?? '',
      }))
    : []
}

export function processResponseBody({ data, headers }: { data: unknown; headers?: Record<string, string> }) {
  const responseHeaders = getResponseHeaders(headers)

  const contentType = responseHeaders.find((header) => header.name.toLowerCase() === 'content-type')
  const mimeType = contentType?.value ? new MimeType(contentType.value) : undefined
  const attachmentFilename = extractFilename(
    responseHeaders.find((header) => header.name.toLowerCase() === 'content-disposition')?.value ?? '',
  )

  const dataUrl = (() => {
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

  return { mimeType, attachmentFilename, dataUrl }
}

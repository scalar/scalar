import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import prettyBytes from 'pretty-bytes'

/** Extract content length from headers */
export const getContentLength = (response: ResponseInstance) => {
  const contentLength = Number.parseInt(
    response.headers?.['Content-Length'] || response.headers?.['content-length'] || '0',
    10,
  )

  return contentLength ? prettyBytes(contentLength) : undefined
}

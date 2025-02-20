// @ts-nocheck
/**
 * Given a headers object retrieve a specific header out of it via a case-insensitive key.
 */
export const getHeaderName = (headers, name) =>
  Object.keys(headers).find(
    (header) => header.toLowerCase() === name.toLowerCase(),
  )
/**
 * Given a headers object retrieve the contents of a header out of it via a case-insensitive key.
 */
export const getHeader = (headers, name) => {
  const headerName = getHeaderName(headers, name)
  if (!headerName) {
    return undefined
  }
  return headers[headerName]
}
/**
 * Determine if a given case-insensitive header exists within a header object.
 */
export const hasHeader = (headers, name) =>
  Boolean(getHeaderName(headers, name))
const mimeTypeJson = [
  'application/json',
  'application/x-json',
  'text/json',
  'text/x-json',
  '+json',
]
/**
 * Determines if a given mimetype is JSON, or a variant of such.
 */
export const isMimeTypeJSON = (mimeType) =>
  mimeTypeJson.some((type) => mimeType.includes(type))

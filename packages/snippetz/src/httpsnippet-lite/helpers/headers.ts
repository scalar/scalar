type Headers<T> = Record<string, T>

/**
 * Given a headers object retrieve a specific header out of it via a case-insensitive key.
 */
export const getHeaderName = <T>(headers: Headers<T>, name: string): string | undefined =>
  Object.keys(headers).find((header) => header.toLowerCase() === name.toLowerCase())

/**
 * Given a headers object retrieve the contents of a header out of it via a case-insensitive key.
 */
export const getHeader = <T>(headers: Headers<T>, name: string): T => {
  const headerName = getHeaderName(headers, name)
  if (!headerName) {
    return undefined as T
  }
  return headers[headerName] as T
}
/**
 * Determine if a given case-insensitive header exists within a header object.
 */
export const hasHeader = <T>(headers: Headers<T>, name: string): boolean => Boolean(getHeaderName(headers, name))

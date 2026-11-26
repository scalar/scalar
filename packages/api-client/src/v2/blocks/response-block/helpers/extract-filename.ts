/**
 * Safely decode a URI component, returning the original string if decoding fails
 */
const decodeURIComponentSafe = (str: string): string => {
  try {
    return decodeURIComponent(str)
  } catch {
    return str
  }
}

// Consume quoted values as a whole so their semicolons cannot start another parameter.
const DISPOSITION_PARAMETER = /(?:^|;)\s*([^"=;\s]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^";]*))/g

/** Extract the download filename from a Content-Disposition header. */
export const extractFilename = (contentDisposition: string): string => {
  let filename: string | undefined

  for (const [, name, quotedValue, unquotedValue] of contentDisposition.matchAll(DISPOSITION_PARAMETER)) {
    if (name === 'filename*') {
      const extendedFilename = unquotedValue?.match(/^UTF-8''(.+)/)?.[1]?.trim()
      if (extendedFilename) {
        return decodeURIComponentSafe(extendedFilename)
      }
    }

    if (name === 'filename' && filename === undefined) {
      const value = quotedValue?.replaceAll(/\\(.)/g, '$1') ?? unquotedValue
      if (value) {
        filename = value.trim()
      }
    }
  }

  return decodeURIComponentSafe(filename ?? '')
}

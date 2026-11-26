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

// Consume the entire quoted value, even when the closing quote is missing.
// Otherwise a semicolon inside a malformed value could start another parameter.
const DISPOSITION_PARAMETER = /(?:^|;)\s*([^"=;\s]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)("|\\?$)|([^";]*))/gs
const MAX_FILENAME_BYTES = 255

const sanitizeFilename = (value: string): string => {
  const lastSeparator = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'))
  const basename = value
    .slice(lastSeparator + 1)
    .replaceAll(/\p{Cc}/gu, '')
    .trim()
  // encodeInto reports how many UTF-16 code units fit without splitting a character.
  const { read } = new TextEncoder().encodeInto(basename, new Uint8Array(MAX_FILENAME_BYTES))
  const filename = basename.slice(0, read).trimEnd()
  return filename === '.' || filename === '..' ? '' : filename
}

/** Extract the download filename from a Content-Disposition header. */
export const extractFilename = (contentDisposition: string): string => {
  let filename = ''

  for (const [, name, quotedValue, closingQuote, unquotedValue] of contentDisposition.matchAll(DISPOSITION_PARAMETER)) {
    if (quotedValue !== undefined && closingQuote !== '"') {
      break
    }

    const parameterName = name?.toLowerCase()
    if (parameterName === 'filename*') {
      const extendedValue = unquotedValue?.trim().match(/^utf-8'[^']*'(.+)$/i)?.[1]
      const extendedFilename = extendedValue ? sanitizeFilename(decodeURIComponentSafe(extendedValue)) : ''
      if (extendedFilename) {
        return extendedFilename
      }
    }

    if (parameterName === 'filename' && !filename) {
      const value = quotedValue?.replaceAll(/\\(.)/gs, '$1') ?? unquotedValue ?? ''
      filename = sanitizeFilename(value)
    }
  }

  return filename
}

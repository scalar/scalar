export const sanitizeBasePath = (basePath: string) => {
  return basePath.replace(/^\/+|\/+$/g, '')
}

/** Extracts an element id from the hash when using hash routing */
export const getIdFromHash = (location: string | URL) => {
  const url = typeof location === 'string' ? new URL(location) : location
  return decodeURIComponent(url.hash.slice(1))
}

/** Extracts an element id from the path when using path routing */
export const getIdFromPath = (location: string | URL, basePath: string) => {
  const url = typeof location === 'string' ? new URL(location) : location
  const sanitized = sanitizeBasePath(basePath)

  // Construct the full basePath with leading slash and encode it for matching
  // We need to encode each segment separately to match how URLs encode pathnames
  const basePathWithSlash = sanitized
    ? `/${sanitized
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')}`
    : ''

  // Extract the portion after the basePath
  if (url.pathname.startsWith(basePathWithSlash)) {
    const remainder = url.pathname.slice(basePathWithSlash.length)
    return decodeURIComponent(remainder.startsWith('/') ? remainder.slice(1) : remainder)
  }

  return ''
}

export const getIdFromUrl = (
  url: string | URL,
  basePath: string | undefined,
  isMultiDocument: boolean,
  slug: string,
) => {
  const base = typeof basePath === 'string' ? getIdFromPath(url, basePath) : getIdFromHash(url)
  return isMultiDocument ? base : `${slug}/${base}`
}

/**
 * Generate a new URL and applies the ID to the path or hash
 * depending on the type of routing used
 */
export const makeUrlFromId = (_id: string, basePath: string | undefined, isMultiDocument: boolean) => {
  if (typeof window === 'undefined') {
    return undefined
  }

  /** When there is only 1 document we don't need to include the document name in the URL */
  const id = isMultiDocument ? _id : _id.split('/').slice(1).join('/')

  const url = new URL(window.location.href)

  if (typeof basePath === 'string') {
    const base = sanitizeBasePath(basePath)
    url.pathname = `${base}/${id}`
  } else {
    url.hash = id
  }

  return url
}

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

export const getIdFromUrl = (url: string | URL, basePath: string | undefined) => {
  return typeof basePath === 'string' ? getIdFromPath(url, basePath) : getIdFromHash(url)
}

/**
 * Generate a new URL and applies the ID to the path or hash
 * depending on the type of routing used
 */
export const makeUrlFromId = (id: string, basePath: string | undefined) => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const url = new URL(window.location.href)

  if (typeof basePath === 'string') {
    const base = sanitizeBasePath(basePath)
    url.pathname = `${base}/${id}`
  } else {
    url.hash = id
  }

  return url
}

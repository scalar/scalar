export const sanitizeBasePath = (basePath: string) => {
  return basePath.replace(/^\/+|\/+$/g, '')
}

/** Extracts an element id from the hash when using hash routing */
export const getIdFromHash = (location: string | URL, slugPrefix: string | undefined) => {
  const url = typeof location === 'string' ? new URL(location) : location

  const base = decodeURIComponent(url.hash.slice(1))

  return slugPrefix ? `${slugPrefix}${base ? '/' : ''}${base}` : base
}
/** Extracts an element id from the path when using path routing */
export const getIdFromPath = (location: string | URL, basePath: string, slugPrefix: string | undefined) => {
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
    const base = decodeURIComponent(remainder.startsWith('/') ? remainder.slice(1) : remainder)
    return slugPrefix ? `${slugPrefix}${base ? '/' : ''}${base}` : base
  }

  return slugPrefix ?? ''
}

/**
 * Extracts a navigation id from a URL based on the routing type
 *
 * @param url - The URL to extract the id from
 * @param basePath - The base path used in path routing
 * @param slugPrefix - If the document slug is not expected in the URL then we must prefix it
 */
export const getIdFromUrl = (url: string | URL, basePath: string | undefined, slugPrefix: string | undefined) => {
  return typeof basePath === 'string' ? getIdFromPath(url, basePath, slugPrefix) : getIdFromHash(url, slugPrefix)
}

/**
 * Generate a new URL and applies the ID to the path or hash
 * depending on the type of routing used
 *
 * @param id - The id to apply to the URL
 * @param basePath - The base path used in path routing
 * @param isMultiDocument - Whether the document is multi-document or single-document. Single-document documents will strip the document slug from the id
 */
export const makeUrlFromId = (_id: string, basePath: string | undefined, isMultiDocument: boolean) => {
  if (typeof window === 'undefined') {
    return undefined
  }

  /** When there is only 1 document we don't need to include the document name in the URL */
  const id = isMultiDocument ? _id : _id.split('/').filter(Boolean).slice(1).join('/')

  const url = new URL(window.location.href)

  if (typeof basePath === 'string') {
    const base = sanitizeBasePath(basePath)
    url.pathname = `${base}/${id}`
  } else {
    url.hash = id
  }

  return url
}

/** Extracts the schema parameters from the id if they are present */
export const getSchemaParamsFromId = (id: string): { rawId: string; params: string } => {
  const matcher = id.match(/(.*)(\.body\.|\.path\.|\.query\.|\.header\.)(.*)/)

  if (matcher && typeof matcher[1] === 'string' && typeof matcher[2] === 'string') {
    return {
      rawId: matcher[1],
      params: matcher[2].slice(1) + matcher[3],
    }
  }
  return {
    rawId: id,
    params: '',
  }
}

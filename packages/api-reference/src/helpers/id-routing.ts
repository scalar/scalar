export const sanitizeBasePath = (basePath: string) => {
  return basePath.replace(/^\/+|\/+$/g, '')
}

const isHashBasePath = (basePath: string) => basePath.startsWith('#')

const sanitizeHashBasePath = (basePath: string) => {
  return basePath.replace(/^#+/, '').replace(/\/+$/g, '')
}

const applySlugPrefix = (base: string, slugPrefix: string | undefined) => {
  return slugPrefix ? `${slugPrefix}${base ? '/' : ''}${base}` : base
}

const stripBasePathPrefix = (value: string, basePath: string) => {
  if (value === basePath) {
    return ''
  }

  if (value.startsWith(`${basePath}/`)) {
    return value.slice(basePath.length + 1)
  }

  return null
}

/** Extracts an element id from the hash when using hash routing */
export const getIdFromHash = (location: string | URL, slugPrefix: string | undefined) => {
  const url = typeof location === 'string' ? new URL(location) : location

  const base = decodeURIComponent(url.hash.slice(1))

  return applySlugPrefix(base, slugPrefix)
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
    return applySlugPrefix(base, slugPrefix)
  }

  return slugPrefix ?? ''
}

/** Extracts an element id from a hash-prefixed basePath */
export const getIdFromHashBasePath = (location: string | URL, basePath: string, slugPrefix: string | undefined) => {
  const url = typeof location === 'string' ? new URL(location) : location
  const hash = decodeURIComponent(url.hash.slice(1))
  const sanitized = sanitizeHashBasePath(basePath)

  const remainder = stripBasePathPrefix(hash, sanitized)
  if (remainder !== null) {
    return applySlugPrefix(remainder, slugPrefix)
  }

  return slugPrefix ?? ''
}

/** Determines whether a URL matches the provided basePath. */
export const matchesBasePath = (location: string | URL, basePath: string) => {
  const url = typeof location === 'string' ? new URL(location) : location

  if (isHashBasePath(basePath)) {
    const hash = decodeURIComponent(url.hash)
    return hash === basePath || hash.startsWith(`${basePath}/`)
  }

  const sanitized = sanitizeBasePath(basePath)
  const basePathWithSlash = sanitized
    ? `/${sanitized
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')}`
    : ''

  return url.pathname === basePathWithSlash || url.pathname.startsWith(`${basePathWithSlash}/`)
}

/**
 * Extracts a navigation id from a URL based on the routing type
 *
 * @param url - The URL to extract the id from
 * @param basePath - The base path used in path routing
 * @param slugPrefix - If the document slug is not expected in the URL then we must prefix it
 */
export const getIdFromUrl = (url: string | URL, basePath: string | undefined, slugPrefix: string | undefined) => {
  if (typeof basePath !== 'string') {
    return getIdFromHash(url, slugPrefix)
  }

  return isHashBasePath(basePath)
    ? getIdFromHashBasePath(url, basePath, slugPrefix)
    : getIdFromPath(url, basePath, slugPrefix)
}

/**
 * Strips the first segment from an id and preserves trailing slashes
 * Used in single-document mode where the document slug is not needed in the URL
 *
 * @param id - The full id to process
 * @returns The id with the first segment removed, preserving trailing slash if present
 */
const stripFirstSegment = (id: string): string => {
  // For preserving trailing slash in the id
  const hasTrailingSlash = id.endsWith('/')
  const segments = id.split('/').filter(Boolean).slice(1)
  const result = segments.join('/')

  // Only preserve trailing slash if there's actual content
  return hasTrailingSlash && result ? `${result}/` : result
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
  const id = isMultiDocument ? _id : stripFirstSegment(_id)
  const url = new URL(window.location.href)

  if (typeof basePath === 'string') {
    if (isHashBasePath(basePath)) {
      const base = sanitizeHashBasePath(basePath)
      url.hash = [base, id].filter(Boolean).join('/')
    } else {
      const base = sanitizeBasePath(basePath)
      url.pathname = `${base}/${id}`
    }
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

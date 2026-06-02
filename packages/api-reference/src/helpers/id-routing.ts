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

/**
 * Builds the URL-encoded, slash-prefixed form of a sanitized base path.
 *
 * Each segment is encoded separately so the result matches how the browser stores
 * `location.pathname` (which encodes within segments but leaves the slashes between them).
 */
const encodeBasePath = (sanitized: string) => {
  if (!sanitized) {
    return ''
  }

  return `/${sanitized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
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
  const basePathWithSlash = encodeBasePath(sanitizeBasePath(basePath))

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

  const basePathWithSlash = encodeBasePath(sanitizeBasePath(basePath))

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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * A located navigation id: the decoded id plus a way to write a rewritten id back.
 */
type IdCarrier = {
  /** The decoded navigation id with all routing chrome (`#`, base path) removed. */
  value: string
  /** Splices `next` back into the location this id came from, preserving the URL shape. */
  write: (next: string) => void
}

/**
 * Locates the navigation id inside a URL regardless of the routing mode.
 *
 * The id can live in three places — the bare hash, a hash base path (`#<base>/<id>`), or the
 * pathname after a path base path. Returning the decoded id alongside a `write` callback lets
 * callers edit ids in id-space without re-deriving the routing chrome for each mode.
 */
const locateIdCarrier = (url: URL, basePath: string | undefined): IdCarrier => {
  // Hash routing: the id is the bare fragment.
  if (typeof basePath !== 'string') {
    return {
      value: decodeURIComponent(url.hash.slice(1)),
      write: (next) => {
        url.hash = next
      },
    }
  }

  // Hash base path routing: the id follows a `#<base>/` prefix.
  if (isHashBasePath(basePath)) {
    const base = sanitizeHashBasePath(basePath)
    const hash = decodeURIComponent(url.hash.slice(1))

    return {
      value: stripBasePathPrefix(hash, base) ?? '',
      write: (next) => {
        url.hash = [base, next].filter(Boolean).join('/')
      },
    }
  }

  // Path routing: the id follows the (URL-encoded) base path in the pathname.
  const base = sanitizeBasePath(basePath)
  const remainder = stripBasePathPrefix(url.pathname, encodeBasePath(base))

  return {
    value: remainder === null ? '' : decodeURIComponent(remainder),
    write: (next) => {
      // Assigning to `pathname` re-encodes characters, so we splice with the decoded base.
      url.pathname = base ? `/${base}/${next}` : `/${next}`
    },
  }
}

/** Optional `(tag-group/<n>/)?tag/<slug>/` chrome that may sit in front of a `model/` segment. */
const TAG_CHROME = '(?:(?:tag-group/[^/]+/)?tag/[^/]+/)?'

/**
 * Rewrites the leading legacy `model/` segment of a navigation id to the current section slug.
 *
 * The match is anchored to the legacy structural shape — `<doc>/(tag chrome/)?model/` — so an
 * operation path like `default/POST/model/train` (the segment after the chrome is `POST/`, not
 * `model/`) and an operation under a tag named "model" (`default/tag/model/POST/foo`) are left
 * alone. In single-document mode the document slug may be absent from the id, so it is optional.
 *
 * Returns the id unchanged when there is no legacy segment to rewrite.
 */
const rewriteLegacyModelSegment = (
  id: string,
  documentSlug: string,
  modelsSectionSlug: string,
  isMultiDocument: boolean,
) => {
  const escapedDoc = escapeRegex(documentSlug)
  // Multi-document ids always carry the slug; single-document bookmarks may omit it.
  const documentPrefix = isMultiDocument ? `${escapedDoc}/` : `(?:${escapedDoc}/)?`
  const legacySegment = new RegExp(`^(${documentPrefix}${TAG_CHROME})model/`)
  // `modelsSectionSlug` lands in the replacement string, where `$` is a special token — escape it.
  const replacement = `$1${modelsSectionSlug.replace(/\$/g, '$$$$')}/`

  return id.replace(legacySegment, replacement)
}

/**
 * Rewrite legacy `model/<name>` schema bookmarks to the current section's plural slug.
 *
 * Earlier versions hardcoded `model/` (singular) as the prefix for individual schema entries
 * even though the section itself was `models/`. We now use the same plural slug for both, so old
 * bookmarks like `#default/model/User` would 404. This canonicalizes them in place.
 *
 * The URL is reduced to its routing-agnostic id (see {@link locateIdCarrier}), the legacy segment
 * is rewritten in id-space (see {@link rewriteLegacyModelSegment}), and the result is spliced back
 * into the original location. This handles hash, hash-base-path, and path routing uniformly.
 *
 * Returns the canonicalized URL when a rewrite happens, or null otherwise.
 */
export const redirectLegacyModelUrl = (
  url: string | URL,
  modelsSectionSlug: string,
  documentSlug: string,
  isMultiDocument: boolean,
  basePath?: string,
): URL | null => {
  if (!documentSlug) {
    return null
  }

  const target = new URL(typeof url === 'string' ? url : url.toString())
  const carrier = locateIdCarrier(target, basePath)
  const rewritten = rewriteLegacyModelSegment(carrier.value, documentSlug, modelsSectionSlug, isMultiDocument)

  if (rewritten === carrier.value) {
    return null
  }

  carrier.write(rewritten)
  return target
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

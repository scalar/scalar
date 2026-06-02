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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Rewrite legacy `/model/<name>` URL segments to the current section's slug.
 *
 * Earlier versions hardcoded `model/` (singular) as the prefix for individual schema entries
 * even though the section itself was `models/`. We now use the same plural slug for both,
 * so old bookmarks like `#default/model/User` would 404. This rewrites them in place.
 *
 * The regex is anchored to the legacy structural shape so unrelated `/model/` occurrences
 * inside operation paths (e.g. `POST /model/train` for an AI/ML API → `default/POST/model/train`)
 * and a tag literally named "model" are left alone.
 *
 * Trade-off: in single-document mode the URL strips the document slug, which makes
 * `#tag/<slug>/model/<name>` ambiguous with an operation under a tag named "model".
 * Single-doc tagged-model bookmarks are not rewritten — only top-level models.
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

  const next = typeof url === 'string' ? new URL(url) : new URL(url.toString())
  const escapedDoc = escapeRegex(documentSlug)
  // Optional `(tag-group/<n>/)?tag/<slug>/` block in front of `model/`.
  const tagPrefix = '(?:(?:tag-group\\/[^/]+\\/)?tag\\/[^/]+\\/)?'
  const slugAnchoredHash = new RegExp(`^(#${escapedDoc}\\/${tagPrefix})model\\/`)
  const replacement = `$1${modelsSectionSlug}/`

  // Always try the slug-anchored form first — old bookmarks may include the doc slug
  // even in single-document mode.
  let newHash = next.hash.replace(slugAnchoredHash, replacement)
  if (newHash === next.hash && !isMultiDocument) {
    // Single-doc fallback: URL omits the doc slug (`#model/<name>`). We can only
    // safely rewrite top-level models here — `#tag/<slug>/model/<name>` is
    // ambiguous with an operation under a tag literally named "model".
    newHash = next.hash.replace(/^(#)model\//, replacement)
  }

  let newPathname = next.pathname
  if (basePath !== undefined && !basePath.startsWith('#')) {
    const escapedBase = escapeRegex(sanitizeBasePath(basePath))
    const basePrefix = escapedBase ? `\\/${escapedBase}` : ''
    const slugAnchoredPath = new RegExp(`^(${basePrefix}\\/${escapedDoc}\\/${tagPrefix})model\\/`)
    newPathname = next.pathname.replace(slugAnchoredPath, replacement)
    if (newPathname === next.pathname && !isMultiDocument) {
      newPathname = next.pathname.replace(new RegExp(`^(${basePrefix}\\/)model\\/`), replacement)
    }
  }

  if (newHash === next.hash && newPathname === next.pathname) {
    return null
  }

  next.hash = newHash
  next.pathname = newPathname
  return next
}

/**
 * A getter for a reactive value.
 *
 * Routing options are passed as getters rather than Vue refs so this module stays framework-free
 * (it is re-exported from the public `@scalar/api-reference/helpers` entry). Each routing call
 * invokes the getter, so switching the active document is reflected without recreating the router.
 */
type Getter<T> = () => T

/**
 * Reactive routing context for the active document.
 *
 * Path routing, hash routing, and hash-base-path routing each store the navigation id in a
 * different place, and single-document mode omits the document slug from the URL. These options
 * capture that context once so call sites do not have to re-derive it.
 */
type RoutingOptions = {
  /** Base path for the active document (`config.pathRouting?.basePath`). Hash routing when undefined. */
  basePath: Getter<string | undefined>
  /** Whether the workspace renders multiple documents — controls whether the doc slug appears in the URL. */
  isMultiDocument: Getter<boolean>
  /** Slug of the active document; prefixes ids when the slug is omitted from single-document URLs. */
  documentSlug: Getter<string>
  /** Slug of the models section, for the legacy `model/` → `models/` redirect. */
  modelsSectionSlug: Getter<string>
}

/**
 * Translates between the address bar and navigation ids for the active document.
 *
 * This is the in-house router for `@scalar/api-reference`: it owns URL ⇄ id translation and the
 * history writes, but deliberately not scrolling or intersection — reconciling the scroll position
 * with the URL stays with the component that orchestrates it.
 */
type Routing = {
  /** The id encoded in `url` (defaults to the current location), normalized for the active document. */
  getId: (url?: string | URL) => string
  /** The URL that encodes `id`, or undefined during SSR. */
  getUrl: (id: string) => URL | undefined
  /** A canonicalized URL when `url` is a legacy `model/` link, otherwise null. */
  redirectLegacy: (url: string | URL) => URL | null
  /** Write `id` to the address bar with a new history entry; returns the new URL (undefined during SSR). */
  push: (id: string) => URL | undefined
  /** Write `id` to the address bar in place; returns the new URL (undefined during SSR). */
  replace: (id: string) => URL | undefined
  /** Subscribe to browser back/forward navigation. Returns an unsubscribe function. */
  onNavigate: (handler: (id: string) => void) => () => void
}

export const createRouting = (options: RoutingOptions): Routing => {
  // Multi-document URLs carry the slug already; single-document URLs need it added back.
  const slugPrefix = () => (options.isMultiDocument() ? undefined : options.documentSlug())

  const getId: Routing['getId'] = (url) => {
    if (url === undefined && typeof window === 'undefined') {
      return ''
    }

    return getIdFromUrl(url ?? window.location.href, options.basePath(), slugPrefix())
  }

  const getUrl: Routing['getUrl'] = (id) => makeUrlFromId(id, options.basePath(), options.isMultiDocument())

  const redirectLegacy: Routing['redirectLegacy'] = (url) =>
    redirectLegacyModelUrl(
      url,
      options.modelsSectionSlug(),
      options.documentSlug(),
      options.isMultiDocument(),
      options.basePath(),
    )

  const push: Routing['push'] = (id) => {
    const url = getUrl(id)
    if (url) {
      window.history.pushState({}, '', url)
    }

    return url
  }

  const replace: Routing['replace'] = (id) => {
    const url = getUrl(id)
    if (url) {
      window.history.replaceState({}, '', url.toString())
    }

    return url
  }

  const onNavigate: Routing['onNavigate'] = (handler) => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const listener = () => handler(getId())
    window.addEventListener('popstate', listener)

    return () => window.removeEventListener('popstate', listener)
  }

  return { getId, getUrl, redirectLegacy, push, replace, onNavigate }
}

/**
 * Determines which document a URL points to on initial load.
 *
 * Path routing does not tell us up front which base path to expect, so we try each document's base
 * path until one matches, parse the id, and read the document slug from its first segment. Falls
 * back to an empty string when no slug can be derived (for example with plain hash routing).
 */
export const getDocumentSlugFromUrl = (
  url: string | URL,
  basePaths: (string | undefined)[],
  options: { isMultiDocument: boolean; activeSlug: string },
): string => {
  const matchedBasePath = basePaths.find((basePath) => (basePath ? matchesBasePath(url, basePath) : false))
  const id = getIdFromUrl(url, matchedBasePath, options.isMultiDocument ? undefined : options.activeSlug)

  return id.split('/')[0] ?? ''
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

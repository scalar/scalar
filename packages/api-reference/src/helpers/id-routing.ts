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

/** Carrier for an id that lives in the bare hash fragment (`#<id>`). */
const bareHashCarrier = (url: URL): IdCarrier => ({
  value: decodeURIComponent(url.hash.slice(1)),
  write: (next) => {
    url.hash = next
  },
})

/**
 * Locates the navigation id inside a URL regardless of the routing mode.
 *
 * The id can live in three places — the bare hash, a hash base path (`#<base>/<id>`), or the
 * pathname after a path base path. Each carrier pairs the decoded id with a `write` callback, so
 * callers edit ids in id-space without re-deriving the routing chrome for each mode.
 *
 * Multiple carriers are returned in priority order: the canonical location for the active routing
 * mode comes first, followed by any legacy fallback. Path routing falls back to the bare hash so a
 * stale `#default/model/User` bookmark (left over from before path routing was enabled) is still
 * canonicalized — the previous implementation rewrote both the path and the hash on every load.
 */
const locateIdCarriers = (url: URL, basePath: string | undefined): IdCarrier[] => {
  // Hash routing: the id is the bare fragment.
  if (typeof basePath !== 'string') {
    return [bareHashCarrier(url)]
  }

  // Hash base path routing: the id follows a `#<base>/` prefix.
  if (isHashBasePath(basePath)) {
    const base = sanitizeHashBasePath(basePath)
    const hash = decodeURIComponent(url.hash.slice(1))

    return [
      {
        value: stripBasePathPrefix(hash, base) ?? '',
        write: (next) => {
          url.hash = [base, next].filter(Boolean).join('/')
        },
      },
    ]
  }

  // Path routing: the id follows the (URL-encoded) base path in the pathname.
  const base = sanitizeBasePath(basePath)
  const remainder = stripBasePathPrefix(url.pathname, encodeBasePath(base))

  return [
    {
      value: remainder === null ? '' : decodeURIComponent(remainder),
      write: (next) => {
        // Assigning to `pathname` re-encodes characters, so we splice with the decoded base.
        url.pathname = base ? `/${base}/${next}` : `/${next}`
      },
    },
    // Legacy fallback: an old hash-routing bookmark may still carry the id in the fragment.
    bareHashCarrier(url),
  ]
}

/**
 * A single redirect rule, expressed in routing-agnostic id-space.
 *
 * Ids are navigation strings with all routing chrome (`#`, base path) stripped — see
 * {@link locateIdCarrier}. A rule is just the shape of an id rewrite: `match` is tested against the
 * id and `replace` follows the native `String.prototype.replace` contract, so a rule can be a plain
 * segment swap or an arbitrary replacer function. A rule that does not match leaves the id alone.
 */
type IdRedirect = {
  /** Pattern tested against the routing-agnostic id. */
  match: RegExp
  /** Replacement passed straight to `String.prototype.replace` (template string or replacer fn). */
  replace: string | ((substring: string, ...groups: string[]) => string)
}

/**
 * Applies redirect rules to an id and returns the first rewrite that changes it.
 *
 * Rules are tried in order and the search stops at the first match, so list more specific rules
 * before more general ones. Returns the id unchanged when no rule applies.
 */
const applyIdRedirects = (id: string, redirects: IdRedirect[]): string => {
  for (const { match, replace } of redirects) {
    // The ternary narrows the union so each `String.prototype.replace` overload type-checks.
    const next = typeof replace === 'string' ? id.replace(match, replace) : id.replace(match, replace)
    if (next !== id) {
      return next
    }
  }

  return id
}

/** Optional `(tag-group/<n>/)?tag/<slug>/` chrome that may sit in front of a section segment. */
const TAG_CHROME = '(?:(?:tag-group/[^/]+/)?tag/[^/]+/)?'

/**
 * Runtime values the redirect rules are built from.
 *
 * The rules are data, but a few entries depend on per-document values (the configurable models
 * section slug, the active document slug, single- vs multi-document mode), so the list is built per
 * call rather than declared as a static constant.
 */
type RedirectContext = {
  /** Current (possibly customized) slug of the models section, e.g. `models` or `schemas`. */
  modelsSectionSlug: string
  /** Slug of the active document; legacy ids are anchored to it to avoid false positives. */
  documentSlug: string
  /** Multi-document ids always carry the doc slug; single-document bookmarks may omit it. */
  isMultiDocument: boolean
}

/**
 * Builds the list of id redirects for the current document.
 *
 * Add an entry here to support a new redirect. Each rule runs against every URL shape (hash, hash
 * base path, path) for free, because rules operate on routing-agnostic ids.
 */
const buildRedirects = ({ modelsSectionSlug, documentSlug, isMultiDocument }: RedirectContext): IdRedirect[] => {
  const escapedDoc = escapeRegex(documentSlug)
  // Keeping the tag chrome inside the doc-slug group is deliberate: a slug-less
  // `tag/<slug>/<segment>/<name>` is left alone, since once the document slug is stripped it is
  // ambiguous with an operation under a tag literally named after the segment.
  const documentPrefix = isMultiDocument ? `${escapedDoc}/${TAG_CHROME}` : `(?:${escapedDoc}/${TAG_CHROME})?`

  // Rewrites a leading `<from>/` section segment to the current models section slug. The trailing
  // `/` leaves an already-correct segment and operation paths such as `default/POST/model/train`
  // untouched.
  const renameSectionSegment = (from: string): IdRedirect => ({
    match: new RegExp(`^(${documentPrefix})${escapeRegex(from)}/`),
    replace: (_match, prefix) => `${prefix}${modelsSectionSlug}/`,
  })

  const redirects = [
    // Earlier versions hardcoded a singular `model/` prefix for individual schema entries even
    // though the section itself was plural, so old bookmarks like `default/model/User` would 404.
    renameSectionSegment('model'),
  ]

  // The models section used to live at the literal `models/`. Once a custom label moves it
  // elsewhere (e.g. `schemas/`), older `models/<name>` bookmarks must follow it. When the slug is
  // still the default `models` this would be a no-op, so only register it when it actually differs.
  if (modelsSectionSlug !== 'models') {
    redirects.push(renameSectionSegment('models'))
  }

  return redirects
}

/**
 * Rewrites navigation ids in a URL to their current form.
 *
 * The URL is reduced to its routing-agnostic id (see {@link locateIdCarriers}), each redirect rule
 * is applied in id-space (see {@link buildRedirects}), and the result is spliced back into the
 * original location. This handles hash, hash-base-path, and path routing uniformly, so a new
 * redirect only has to be added to the list once.
 *
 * Returns the canonicalized URL when a rewrite happens, or null otherwise.
 */
export const redirectUrl = (
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
  const redirects = buildRedirects({ modelsSectionSlug, documentSlug, isMultiDocument })

  // Try each place the id might live, in priority order, and apply the first rewrite that sticks.
  for (const carrier of locateIdCarriers(target, basePath)) {
    const rewritten = applyIdRedirects(carrier.value, redirects)
    if (rewritten !== carrier.value) {
      carrier.write(rewritten)
      return target
    }
  }

  return null
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

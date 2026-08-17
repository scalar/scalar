import { slugify } from '@scalar/helpers/string/slugify'

/**
 * Strips leading slashes.
 *
 * Scanned by hand rather than with a regex: an unanchored `\/+` alternative
 * is retried at every index, so a base path made of many slashes costs
 * quadratic time. The base path comes from consumer configuration, which
 * makes it reachable from the exported helpers below.
 */
const trimLeadingSlashes = (value: string) => {
  let start = 0

  while (start < value.length && value[start] === '/') {
    start += 1
  }

  return value.slice(start)
}

/** Strips trailing slashes, linear for the same reason as {@link trimLeadingSlashes} */
const trimTrailingSlashes = (value: string) => {
  let end = value.length

  while (end > 0 && value[end - 1] === '/') {
    end -= 1
  }

  return value.slice(0, end)
}

export const sanitizeBasePath = (basePath: string) => {
  return trimTrailingSlashes(trimLeadingSlashes(basePath))
}

const isHashBasePath = (basePath: string) => basePath.startsWith('#')

const sanitizeHashBasePath = (basePath: string) => {
  // The leading `#` strip is anchored, so it cannot backtrack
  return trimTrailingSlashes(basePath.replace(/^#+/, ''))
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

/**
 * Builds a crawlable href for a navigation id without reading the current location
 *
 * Unlike {@link makeUrlFromId} this does not depend on `window`, so it is safe to
 * call during server side rendering. That matters because the hrefs must be present
 * in the server rendered HTML for search engines to crawl the sidebar navigation.
 *
 * A scratch URL carries the encoding so the href is spelled the same way as the
 * path {@link makeUrlFromId} pushes to history — otherwise the same section would
 * exist under two URL spellings (the crawled one and the clicked one). The href is
 * relative, so unlike the pushed URL it does not carry the current query string,
 * and a degenerate id that would resolve off site is normalized (see below).
 *
 * @param id - The id to build the href for
 * @param basePath - The base path used in path routing
 * @param isMultiDocument - Whether the document is multi-document or single-document. Single-document documents will strip the document slug from the id
 */
export const makeHrefFromId = (_id: string, basePath: string | undefined, isMultiDocument: boolean): string => {
  /** When there is only 1 document we don't need to include the document name in the URL */
  const id = isMultiDocument ? _id : stripFirstSegment(_id)

  // The scheme must be a special one (like http) so the WHATWG encoding rules
  // match the ones applied to window.location by makeUrlFromId
  const url = new URL('http://scratch')

  if (typeof basePath === 'string') {
    if (isHashBasePath(basePath)) {
      const base = sanitizeHashBasePath(basePath)
      url.hash = [base, id].filter(Boolean).join('/')
      return url.hash || '#'
    }

    url.pathname = `${sanitizeBasePath(basePath)}/${id}`

    // A path starting with two slashes is a protocol-relative reference, so an
    // href of `//example.com/x` would leave the site entirely. That can happen
    // when there is no base path and the id itself starts with a slash (a
    // document whose title slugifies to an empty string). Collapsing the
    // leading slashes keeps the link on this origin, which is where the
    // equivalent URL from makeUrlFromId points too.
    return url.pathname.replace(/^\/+/, '/')
  }

  url.hash = id
  return url.hash || '#'
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
 * Multiple carriers are returned: the canonical location for the active routing mode comes first,
 * followed by a legacy bare-hash carrier. Both path and hash-base-path routing include the bare hash
 * so a stale `#default/model/User` bookmark (left over from before the base path was configured) is
 * still canonicalized — the previous implementation rewrote such doc-slug-anchored hashes on every
 * load regardless of the routing mode. Callers rewrite every carrier that matches, not just the
 * first, so a legacy id sitting in both the pathname and the hash is cleaned up in one pass.
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
      // Legacy fallback: an old bookmark may carry the id in the fragment without the base prefix.
      bareHashCarrier(url),
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
 * Markers that separate an operation id from a schema path within an anchor id.
 * `responses` mirrors the request-body/parameter markers so response property
 * anchors (e.g. `operation.responses.200.name`) resolve back to the operation id.
 * Without it, deep links into responses cannot find their operation.
 */
const SCHEMA_PARAM_MARKERS = ['.body.', '.path.', '.query.', '.header.', '.responses.']

/**
 * Source data for a single webhook redirect: the raw event name, its method, and the current id.
 *
 * The current slug is read back off the id, so this layer does not need to know the (dot-keeping)
 * slug rule — it only reproduces the legacy (dot-dropping) slug to match old bookmarks.
 */
export type WebhookRedirectSource = {
  /** Raw webhook event name from the OpenAPI `webhooks` key, e.g. `account_holder.created`. */
  name: string
  /** HTTP method of the webhook operation. */
  method: string
  /** Current navigation id of the webhook, e.g. `default/webhook/POST/account-holder.created`. */
  id: string
}

/**
 * Builds redirect rules mapping each webhook's legacy dot-dropped slug to its current slug.
 *
 * Webhook ids used to slugify the event name with no options, which dropped dots
 * (`account_holder.created` -> `account-holdercreated`); the current id keeps them
 * (`account-holder.created`). That rewrite cannot be reversed generically, so we emit one exact rule
 * per webhook whose legacy slug differs from the current one. Each rule matches the invariant
 * `webhook/<METHOD>/<legacy-slug>` tail, so it applies regardless of the document/tag prefix in front
 * of it and preserves any sub-anchor after it. A sub-anchor is either a `/` segment or a dot-joined
 * schema property anchor (e.g. `.body.id`, see {@link SCHEMA_PARAM_MARKERS}); a dot followed by
 * anything else is not treated as a boundary, because the legacy slug never contains a dot while a
 * current webhook slug can, so such a URL belongs to a different webhook.
 *
 * Because the legacy slug is lossy, two things can make a redirect unsafe, and both are dropped so an
 * ambiguous link falls through to normal not-found handling instead of landing on the wrong webhook:
 * - the legacy slug is already another webhook's *current* slug (redirecting it would hijack a valid
 *   URL), or
 * - two webhooks collapse to the same legacy slug (the old bookmark is genuinely ambiguous).
 */
const buildWebhookRedirects = (webhooks: WebhookRedirectSource[]): IdRedirect[] => {
  const key = (method: string, slug: string) => `${method.toUpperCase()}/${slug}`

  // Index current slugs so a legacy redirect never clobbers a real, current URL, and count legacy
  // slugs so we can drop the ones two webhooks share.
  const currentKeys = new Set<string>()
  const legacyCounts = new Map<string, number>()
  for (const { name, method, id } of webhooks) {
    currentKeys.add(key(method, id.slice(id.lastIndexOf('/') + 1)))
    const legacySlug = slugify(name)
    if (legacySlug) {
      const legacyKey = key(method, legacySlug)
      legacyCounts.set(legacyKey, (legacyCounts.get(legacyKey) ?? 0) + 1)
    }
  }

  // Property deep links append their breadcrumb to the operation id with dots
  // (`<slug>.body.id`), so the slug boundary must accept a schema-param marker
  // alongside the end of the id and a `/` segment.
  const boundary = `(?=$|/|${SCHEMA_PARAM_MARKERS.map(escapeRegex).join('|')})`

  const redirects: IdRedirect[] = []
  for (const { name, method, id } of webhooks) {
    const upperMethod = method.toUpperCase()
    const currentSlug = id.slice(id.lastIndexOf('/') + 1)
    const legacySlug = slugify(name)
    const legacyKey = key(method, legacySlug)

    // Skip when the slug did not change, when the legacy slug is a real current URL, or when it is
    // shared by more than one webhook.
    if (
      !legacySlug ||
      legacySlug === currentSlug ||
      currentKeys.has(legacyKey) ||
      (legacyCounts.get(legacyKey) ?? 0) > 1
    ) {
      continue
    }

    redirects.push({
      match: new RegExp(`(^|/)webhook/${escapeRegex(upperMethod)}/${escapeRegex(legacySlug)}${boundary}`),
      replace: (_match, prefix) => `${prefix}webhook/${upperMethod}/${currentSlug}`,
    })
  }

  return redirects
}

/**
 * Rewrites navigation ids in a URL to their current form.
 *
 * The URL is reduced to its routing-agnostic id (see {@link locateIdCarriers}), each redirect rule
 * is applied in id-space (see {@link buildRedirects} for models and {@link buildWebhookRedirects} for
 * webhooks), and the result is spliced back into the original location. This handles hash,
 * hash-base-path, and path routing uniformly, so a new redirect only has to be added to the list once.
 *
 * Returns the canonicalized URL when a rewrite happens, or null otherwise.
 */
export const redirectUrl = (
  url: string | URL,
  modelsSectionSlug: string,
  documentSlug: string,
  isMultiDocument: boolean,
  basePath?: string,
  webhooks: WebhookRedirectSource[] = [],
): URL | null => {
  if (!documentSlug) {
    return null
  }

  const target = new URL(typeof url === 'string' ? url : url.toString())
  const redirects = [
    ...buildRedirects({ modelsSectionSlug, documentSlug, isMultiDocument }),
    ...buildWebhookRedirects(webhooks),
  ]

  // Canonicalize every place the id might live. The carriers are distinct physical locations (the
  // pathname and the bare hash), so a single page load can carry a legacy id in more than one — for
  // example a path-routing URL whose stale hash still holds an old bookmark. Rewriting all of them
  // avoids the address bar showing a corrected path next to an outdated hash. A redirect rule is
  // anchored to the document slug, so it never matches the base-prefixed value of a fallback carrier,
  // which keeps carriers that happen to share a location (hash base path + bare hash) from clobbering
  // each other.
  let didRedirect = false
  for (const carrier of locateIdCarriers(target, basePath)) {
    const rewritten = applyIdRedirects(carrier.value, redirects)
    if (rewritten !== carrier.value) {
      carrier.write(rewritten)
      didRedirect = true
    }
  }

  return didRedirect ? target : null
}

/** Extracts the schema parameters from the id if they are present */
export const getSchemaParamsFromId = (id: string): { rawId: string; params: string } => {
  // Split at the first marker: an operation id never contains one, so everything
  // before the first marker is the operation id and the rest is the schema path.
  // (Splitting at the last marker would mishandle a property named like a marker
  // keyword, e.g. a request body field called `responses`.) A plain string scan
  // avoids the polynomial backtracking a `(.*)marker(.*)` regex would incur on
  // long, marker-less ids.
  let markerIndex = -1
  for (const marker of SCHEMA_PARAM_MARKERS) {
    const index = id.indexOf(marker)
    if (index !== -1 && (markerIndex === -1 || index < markerIndex)) {
      markerIndex = index
    }
  }

  if (markerIndex === -1) {
    return {
      rawId: id,
      params: '',
    }
  }

  return {
    rawId: id.slice(0, markerIndex),
    // Drop the leading dot but keep the marker keyword (e.g. `body.name`).
    params: id.slice(markerIndex + 1),
  }
}

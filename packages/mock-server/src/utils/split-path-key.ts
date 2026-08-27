/**
 * Matches a `{parameterName}` template inside a path key.
 *
 * A template has to be balanced and non-empty, so a stray brace counts as literal path text.
 */
export const PATH_KEY_TEMPLATE = /\{([^{}]+)\}/g

/** A query parameter that an OpenAPI path key pins, for example `beta=true` in `/v1/messages?beta=true`. */
export type PinnedQueryParameter = {
  /** Decoded name of the query parameter. */
  name: string
  /** Decoded value the request has to send, or `undefined` when the path key only pins the name. */
  value: string | undefined
}

/** An OpenAPI path key taken apart into the portion Hono can route and the query it pins. */
type SplitPathKey = {
  /** The path portion of the key, without the query string. */
  path: string
  /** Query parameters the key pins. Empty for a regular path key. */
  query: PinnedQueryParameter[]
}

/**
 * Decode one part of a query string the way `URLSearchParams` does.
 *
 * A malformed escape sequence is kept verbatim instead of throwing, so a single odd path key cannot
 * take the whole server down.
 */
const decodeQueryPart = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

/**
 * Find the `?` that starts the query string of a path key.
 *
 * Only a `?` outside a `{…}` template counts, so a path parameter whose name contains a `?` does not
 * accidentally cut the key in half. An unbalanced brace is literal path text rather than an open
 * template, so it cannot hide the query string of the rest of the key. Returns `-1` when the key
 * carries no query string.
 */
const findQueryStart = (pathKey: string): number => {
  const templates = [...pathKey.matchAll(PATH_KEY_TEMPLATE)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }))

  for (let index = pathKey.indexOf('?'); index !== -1; index = pathKey.indexOf('?', index + 1)) {
    if (!templates.some(({ start, end }) => index > start && index < end)) {
      return index
    }
  }

  return -1
}

/**
 * Split an OpenAPI path key into its path and its pinned query parameters.
 *
 * Some documents carry a literal query string in the path key to describe a variant of an operation,
 * for example `/v1/messages?beta=true` next to `/v1/messages`. That is not a routable path, so the
 * query has to be peeled off and matched against the incoming request separately.
 */
export function splitPathKey(pathKey: string): SplitPathKey {
  const queryStart = findQueryStart(pathKey)

  if (queryStart === -1) {
    return { path: pathKey, query: [] }
  }

  const query = pathKey
    .slice(queryStart + 1)
    .split('&')
    .filter((pair) => pair !== '')
    .map((pair) => {
      const separator = pair.indexOf('=')

      // `?beta` pins the name only, `?beta=true` pins the name and the value.
      return separator === -1
        ? { name: decodeQueryPart(pair), value: undefined }
        : { name: decodeQueryPart(pair.slice(0, separator)), value: decodeQueryPart(pair.slice(separator + 1)) }
    })
    .filter(({ name }) => name !== '')

  return { path: pathKey.slice(0, queryStart), query }
}

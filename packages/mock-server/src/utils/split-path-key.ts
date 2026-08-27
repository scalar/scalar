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
 * accidentally cut the key in half. Returns `-1` when the key carries no query string.
 */
const findQueryStart = (pathKey: string): number => {
  let insideTemplate = false

  for (let index = 0; index < pathKey.length; index++) {
    const character = pathKey[index]

    if (character === '{') {
      insideTemplate = true
    } else if (character === '}') {
      insideTemplate = false
    } else if (character === '?' && !insideTemplate) {
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

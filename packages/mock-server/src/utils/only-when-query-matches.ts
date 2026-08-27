import type { H } from 'hono/types'

import type { PathKeyQueryParameter } from '@/utils/hono-route-from-path'

/**
 * Gate a handler on the query parameters an OpenAPI path key carries.
 *
 * A path key such as `/v1/messages?beta=true` describes one of two operations that share a path, but
 * Hono routes on the pathname alone, so both keys end up on the same route. Wrapping every handler
 * of the query-bearing key makes a request without `beta=true` fall through to the next matching
 * route — which is why that key has to be registered before the one it shares its route with.
 *
 * Handlers of a key without a query string are returned untouched.
 */
export const onlyWhenQueryMatches = (query: PathKeyQueryParameter[], handler: H): H => {
  if (query.length === 0) {
    return handler
  }

  return (c, next) => {
    // Read the whole query at once, so repeated parameters stay a list and `?beta=false&beta=true`
    // still matches. Names come from the document, so a name such as `constructor` or `toString` can
    // read back something inherited from the record's prototype — only an actual list of values counts.
    const queries = c.req.queries()
    const matches = query.every(({ name, value }) => {
      const values = queries[name]

      return Array.isArray(values) && values.includes(value)
    })

    return matches ? handler(c, next) : next()
  }
}

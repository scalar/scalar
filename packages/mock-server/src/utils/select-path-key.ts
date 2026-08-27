import type { H } from 'hono/types'

import type { PathKeyQueryParameter } from '@/utils/hono-route-from-path'

/** Whether the request carries every query parameter a path key asks for */
const carriesEveryParameter = (key: PathKeyQueryParameter[], queries: Record<string, string[]>): boolean =>
  key.every(({ name, value }) => {
    // Names come from the document, so a name such as `constructor` or `toString` can read back
    // something inherited from the record's prototype — only an actual list of values counts.
    const values = queries[name]

    return Array.isArray(values) && values.includes(value)
  })

/**
 * Pick the path key of a route that answers a request.
 *
 * A path key may carry a query string (`/v1/messages?beta=true`), which generators use to describe
 * two operations sharing a path. Hono routes on the pathname alone, so all of them end up on one
 * route and the query string is what tells them apart: the key whose parameters the request carries
 * answers, the most specific one wins, and a tie goes to the key declared first.
 *
 * When no key matches, the least specific one answers anyway. Such a query string tells operations
 * apart rather than describing something a client has to send, and documents written this way often
 * carry no plain key at all — the operation would otherwise never answer its documented URL.
 *
 * @param keys - Query parameters of every path key of the route, in document order
 * @returns The position of the answering key in `keys`
 */
export const selectPathKey = (keys: PathKeyQueryParameter[][], queries: Record<string, string[]>): number => {
  let answering = -1
  let answeringSize = -1
  let fallback = 0
  let fallbackSize = Number.POSITIVE_INFINITY

  keys.forEach((key, position) => {
    // Comparing sizes before matching keeps the earliest key of equal specificity in both races.
    if (key.length < fallbackSize) {
      fallback = position
      fallbackSize = key.length
    }

    if (key.length > answeringSize && carriesEveryParameter(key, queries)) {
      answering = position
      answeringSize = key.length
    }
  })

  return answering === -1 ? fallback : answering
}

/**
 * Gate a handler on its path key being the one that answers the request.
 *
 * Handlers stay registered in document order, so which route answers an overlapping request is
 * decided the same way as for a document without query strings. A key that is not the one to answer
 * hands the request on to the next matching route instead.
 */
export const onlyWhenPathKeyAnswers = (keys: PathKeyQueryParameter[][], position: number, handler: H): H => {
  // A route with a single path key always answers it, whether or not that key carries a query string.
  if (keys.length === 1) {
    return handler
  }

  return (c, next) => (selectPathKey(keys, c.req.queries()) === position ? handler(c, next) : next())
}

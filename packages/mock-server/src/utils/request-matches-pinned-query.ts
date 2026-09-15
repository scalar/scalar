import type { Context } from 'hono'

import type { PinnedQueryParameter } from '@/utils/split-path-key'

/**
 * Check whether a request carries every query parameter a path key pins.
 *
 * `/v1/messages?beta=true` describes a variant of `/v1/messages`, so it may only answer requests
 * that actually send `beta=true`. A parameter pinned without a value (`?beta`) matches any value.
 */
export const requestMatchesPinnedQuery = (context: Context, query: PinnedQueryParameter[]): boolean =>
  query.every(({ name, value }) => {
    const values = context.req.queries(name)

    if (!values?.length) {
      return false
    }

    return value === undefined || values.includes(value)
  })

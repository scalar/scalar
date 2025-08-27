import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

import { getBody } from './getBody'
import { decode } from 'js-base64'

/**
 * Collect all the data from a request
 */
export async function getRequestData(c: Context) {
  let authentication = {}

  const authorizationHeader = c.req.header('Authorization')

  if (authorizationHeader) {
    // if value starts with "Basic "
    if (authorizationHeader.startsWith('Basic ')) {
      const token = authorizationHeader.split(' ')[1]

      if (token) {
        authentication = {
          authentication: {
            type: 'http.basic',
            token,
            value: decode(token),
          },
        }
      }
    }

    if (authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split(' ')[1]

      authentication = {
        authentication: {
          type: 'http.bearer',
          token,
        },
      }
    }
  }

  const headers = Object.fromEntries(c.req.raw.headers)

  const body = await getBody(c)

  const cookies = getCookie(c)

  // Get all query parameters as array
  const query: Record<string, string | string[] | undefined> = c.req.queries()

  // Some query parameters are arrays, some are single values.
  Object.keys(query).forEach((key) => {
    query[key] =
      query?.[key] && query?.[key]?.length > 1
        ? // Array
          query[key]
        : // Single value
          c.req.query(key)
  })

  return {
    method: c.req.method,
    path: c.req.path,
    headers,
    ...authentication,
    cookies,
    query,
    body: body,
  }
}

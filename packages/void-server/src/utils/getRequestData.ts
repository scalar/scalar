import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

import { getBody } from './getBody'

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

      authentication = {
        authentication: {
          type: 'http.basic',
          token,
          value: atob(token),
        },
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

  return {
    method: c.req.method,
    path: c.req.path,
    headers,
    ...authentication,
    cookies,
    query: c.req.query(),
    body: body,
  }
}

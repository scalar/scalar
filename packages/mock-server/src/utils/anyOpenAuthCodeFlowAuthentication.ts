import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * Middleware to check for any bearer authentication header
 */
export function anyOpenAuthCodeFlowAuthentication() {
  return async function (ctx: Context, next: () => Promise<void>) {
    // Check if the request has an Authorization header
    // Note: We don't care *what* credentials are sent, though.
    if (ctx.req.header('Authorization')?.startsWith('Bearer ')) {
      return await next()
    }

    // Unauthorized
    throw new HTTPException(401, {
      res: new Response('Unauthorized', {
        status: 401,
      }),
    })
  }
}

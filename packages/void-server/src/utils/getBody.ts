import type { Context } from 'hono'

/**
 * Get the body of a request, no matter if it’s JSON or text
 */
export async function getBody(c: Context) {
  const body = await c.req.text()

  // Try to parse the body as JSON
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

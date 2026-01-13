import type { Context } from 'hono'

/**
 * Transform an object into a JSON response
 */
export function createJsonResponse(c: Context, data: Record<string, any>) {
  return c.json(data)
}

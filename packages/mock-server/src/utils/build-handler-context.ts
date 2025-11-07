import { faker } from '@faker-js/faker'
import type { Context } from 'hono'

import { store } from '../libs/store'

/**
 * Context object provided to x-handler code.
 */
export type HandlerContext = {
  store: typeof store
  faker: typeof faker
  req: {
    body: any
    params: Record<string, string>
    query: Record<string, string>
    headers: Record<string, string>
  }
}

/**
 * Build the handler context from a Hono context.
 */
export async function buildHandlerContext(c: Context): Promise<HandlerContext> {
  let body: any = undefined

  try {
    const contentType = c.req.header('content-type') ?? ''
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => undefined)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = await c.req.parseBody().catch(() => undefined)
    } else if (contentType.includes('text/')) {
      body = await c.req.text().catch(() => undefined)
    }
  } catch {
    // Ignore parsing errors, body remains undefined
  }

  return {
    store,
    faker,
    req: {
      body,
      params: c.req.param(),
      query: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
      headers: Object.fromEntries(Object.entries(c.req.header()).map(([key, value]) => [key, value ?? ''])),
    },
  }
}

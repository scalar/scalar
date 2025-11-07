import { faker } from '@faker-js/faker'
import type { Context } from 'hono'

import { store } from '../libs/store'
import { createStoreWrapper, type StoreOperationTracking } from './store-wrapper'

/**
 * Context object provided to x-handler code.
 */
export type HandlerContext = {
  store: ReturnType<typeof createStoreWrapper>['wrappedStore']
  faker: typeof faker
  req: {
    body: any
    params: Record<string, string>
    query: Record<string, string>
    headers: Record<string, string>
  }
}

/**
 * Result of building handler context, including operation tracking.
 */
export type HandlerContextResult = {
  context: HandlerContext
  tracking: StoreOperationTracking
}

/**
 * Build the handler context from a Hono context.
 */
export async function buildHandlerContext(c: Context): Promise<HandlerContextResult> {
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

  const { wrappedStore, tracking } = createStoreWrapper(store)

  return {
    context: {
      store: wrappedStore,
      faker,
      req: {
        body,
        params: c.req.param(),
        query: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
        headers: Object.fromEntries(Object.entries(c.req.header()).map(([key, value]) => [key, value ?? ''])),
      },
    },
    tracking,
  }
}

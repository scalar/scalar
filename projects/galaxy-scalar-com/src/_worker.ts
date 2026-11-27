import type { Hono } from 'hono'

import { configureApiReference, createApp } from './galaxy-scalar-com'

// Mock server parsing and seeding exceed Cloudflare's startup CPU budget. Defer
// them until a request arrives, sharing initialization across concurrent requests.
let appPromise: Promise<Hono> | undefined

const getApp = (): Promise<Hono> => {
  appPromise ??= createApp()
    .then((app) => {
      configureApiReference(app)
      return app
    })
    .catch((error: unknown) => {
      appPromise = undefined
      throw error
    })
  return appPromise
}

export default {
  /** Preserve Worker bindings and execution context when dispatching to Hono. */
  fetch: async (...args: Parameters<Hono['fetch']>): Promise<Response> => {
    const app = await getApp()
    return app.fetch(...args)
  },
}

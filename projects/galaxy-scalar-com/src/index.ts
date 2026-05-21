import { configureApiReference, createApp } from './galaxy-scalar-com'

// Top-level await is supported for a Worker's entry module. The app — and its
// seeded mock data — is created once at module initialization, not per request.
const app = await createApp()

configureApiReference(app)

// A Cloudflare Worker exports an object with a `fetch` handler. A Hono app
// already satisfies that shape, so it can be exported directly.
export default app

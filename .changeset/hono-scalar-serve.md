---
'@scalar/hono-api-reference': minor
---

Add `Scalar.serve()` to render the API reference and serve its OpenAPI document from a single mount. Instead of wiring a separate document route and keeping the reference's `url` in sync, mount it once with `app.route('/scalar', Scalar.serve({ document }))`. `document` accepts an OpenAPI object or a function that returns one (for example `() => app.getOpenAPI31Document(...)` from Zod OpenAPI Hono), and the JSON path is configurable via `documentPath`.

---
'@scalar/fastify-api-reference': patch
---

Fix the OpenAPI document endpoints for `url` sources. When the specification was provided via `configuration.url`, the plugin still registered `${routePrefix}/openapi.json` and `${routePrefix}/openapi.yaml`, but they returned a broken response (a 500 for JSON, an empty body for YAML) because the URL string was normalized as if it were the document itself. The reference already loads the URL directly in the browser, so these endpoints are no longer registered for `url` sources — matching the existing behavior for `sources`.

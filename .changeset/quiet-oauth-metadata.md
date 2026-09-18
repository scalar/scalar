---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
'@scalar/api-reference': patch
---

Support OpenAPI 3.2 OAuth2 metadata URLs in workspace schemas and the shared authentication UI. Fetch HTTPS or loopback HTTP authorization server metadata to discover flows or fill missing endpoints while preserving explicit configuration.

For local development, Scalar deliberately relaxes the OpenAPI 3.2 TLS requirement: metadata URLs and discovered endpoints may use HTTP only on `localhost`, `127.0.0.1`, or `[::1]`. All other hosts require HTTPS.

Discovery leaves `refreshUrl` unchanged. Token refresh already falls back to the flow's token URL when no refresh URL is configured, so a discovered token endpoint also supports refresh without overriding an explicit refresh URL.

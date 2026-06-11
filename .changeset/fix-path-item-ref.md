---
'@scalar/workspace-store': patch
'@scalar/schemas': patch
'@scalar/types': patch
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/oas-utils': patch
'@scalar/openapi-to-markdown': patch
'scalar-app': patch
---

fix: resolve operations when OpenAPI path items use `$ref`

Path entries and webhooks can reference `components.pathItems` instead of inlining operations. Navigation, mutators, search, and markdown export now resolve path-item references before reading HTTP methods and path-level parameters.

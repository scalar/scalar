---
'@scalar/openapi-upgrader': patch
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
---

Honor operation-level `produces` for shared Swagger 2.0 responses, including response aliases across documents. Operations that use the same media types reuse the same converted response. Upgrading also preserves literal `$ref` values in examples and vendor extensions.

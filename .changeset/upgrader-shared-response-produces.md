---
'@scalar/openapi-upgrader': patch
'@scalar/workspace-store': patch
---

Use the operation-level `produces` for shared Swagger 2.0 responses. A response referenced through `$ref` was always upgraded with the global `produces`, so an operation declaring `produces: [text/csv]` still showed `application/json`. Operations that override `produces` now get an inline copy of the shared response with their own media types.

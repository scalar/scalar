---
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
'@scalar/openapi-upgrader': patch
---

fix: upgrade OpenAPI 3.0 documents and fragments loaded through external `$ref`s to OpenAPI 3.1, preserving parameter examples and literal example payloads regardless of reference order or fragment encoding

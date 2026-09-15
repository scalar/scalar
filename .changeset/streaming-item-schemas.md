---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': minor
'@scalar/blocks': minor
'@scalar/snippetz': patch
'@scalar/types': minor
---

Support OpenAPI 3.2 streaming item schemas in the workspace store, request body examples, and API reference schema views. Generate framed JSON Lines, JSON Sequence, and server-sent event examples while preserving explicit examples.

Preserve generated falsy request examples (`0`, `false`, and empty strings) for non-streaming bodies as well.

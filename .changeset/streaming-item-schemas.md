---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': minor
'@scalar/blocks': minor
'@scalar/snippetz': patch
'@scalar/types': minor
---

Support OpenAPI 3.2 streaming item schemas in the workspace store, request body examples, and API reference schema views. Frame generated and structured examples as JSON Lines, JSON Sequence, or server-sent events while preserving explicit wire-format strings.

Preserve generated falsy request examples (`0`, `false`, and empty strings) for non-streaming bodies as well.

Use cURL `--data-binary` for supported streaming media types, making framed body handling explicit. Authored arrays and objects are framed as stream records; authored wire-format strings remain unchanged. SSE records with no valid fields are safely omitted with one console warning per serialization call reporting the omitted count, including when all records are omitted.

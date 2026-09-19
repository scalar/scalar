---
'@scalar/helpers': patch
'@scalar/mock-server': minor
'@scalar/workspace-store': minor
---

Generate finite SSE, JSON Lines, NDJSON, and JSON Sequence mock responses from OpenAPI 3.2 itemSchema definitions, including custom handler responses.

Honor named examples in custom stream handlers and keep media-type recognition consistent with stream serialization.

Use the same stream serializer as documentation examples. SSE objects without valid fields are omitted with a console warning per serialization call; other records still stream normally. The mock serializes each item separately to retain individual chunk writes.

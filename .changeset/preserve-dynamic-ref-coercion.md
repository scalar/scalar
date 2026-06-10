---
'@scalar/workspace-store': patch
---

Keep JSON Schema 2020-12 reference keywords (`$id`, `$anchor`, `$dynamicAnchor`, `$dynamicRef`) on Schema Objects when coercing documents during ingestion, so generic templates like `PaginatedResponse<T>` keep their dynamic item binding instead of having it dropped for schemas reachable from an operation

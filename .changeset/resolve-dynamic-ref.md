---
'@scalar/workspace-store': patch
---

Resolve JSON Schema 2020-12 `$dynamicRef` against the active `$dynamicAnchor` when generating examples, so generic patterns like `PaginatedResponse<T>` and recursive trees produce concrete example data instead of empty placeholders

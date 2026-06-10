---
'@scalar/api-reference': patch
---

Render JSON Schema 2020-12 `$dynamicRef` in schemas, so generic patterns like `PaginatedResponse<T>` show their concrete bound item type (for example `User[]`) instead of an empty shape. The reference threads the active dynamic scope through the schema tree and binds each `$dynamicRef` to the matching `$dynamicAnchor`.

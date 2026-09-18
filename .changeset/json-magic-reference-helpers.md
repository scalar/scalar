---
'@scalar/json-magic': minor
---

Expose helpers for indexing locally embedded `$id` and `$anchor` resources and resolving a reference to its local path.

Preserve authored references between embedded schema resources when the containing document has no declared identity. This keeps references valid across `$id` scopes and when exporting the bundle to a different retrieval URL.

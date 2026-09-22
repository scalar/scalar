---
'@scalar/json-magic': minor
---

Preserve authored references between embedded schema resources when the containing document has no declared identity. This keeps references valid across `$id` scopes and when exporting the bundle to a different retrieval URL.

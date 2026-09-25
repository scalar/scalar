---
'@scalar/openapi-upgrader': minor
---

Add `onIncompatible: 'ignore'` for best-effort OpenAPI 3.2 upgrades. Apply available migrations and return the document despite compatibility issues, without mutating the input. Strict mode remains the default; malformed versions and clone errors still throw.

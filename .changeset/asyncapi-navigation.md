---
'@scalar/workspace-store': minor
---

feat: generate AsyncAPI sidebar navigation on document ingest

Add `TraversedAsyncApiOperation`, `traverseAsyncApiDocument`, and wire navigation into the AsyncAPI ingest path so channel operations appear in `x-scalar-navigation`.

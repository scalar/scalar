---
'@scalar/workspace-store': minor
---

feat: generate AsyncAPI sidebar navigation on document ingest

Add `TraversedAsyncApiChannel`, `TraversedAsyncApiOperation`, and `TraversedAsyncApiMessage` navigation entry types, plus `traverseAsyncApiDocument` wired into the AsyncAPI ingest path. Navigation is structured as channel → operation → message, with messages resolved per operation (all channel messages by default, or filtered via `operation.messages`).

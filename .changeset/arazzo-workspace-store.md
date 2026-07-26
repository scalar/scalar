---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
---

feat: ingest Arazzo documents in the workspace store

Adds `isArazzoDocument` and widens `WorkspaceDocument`/`getDocumentType`/`getDocumentTypeLabel` to recognize Arazzo documents. `addDocument()`/`addInMemoryDocument()` now ingest Arazzo 1.0.x/1.1.x documents directly (no upgrader needed — 1.1 is additive over 1.0.x), bundling and validating them against the Arazzo schema. Navigation traversal and rendering are not included yet, so an Arazzo document currently contributes no sidebar entries or reference UI — it is addressable and stored, nothing more.

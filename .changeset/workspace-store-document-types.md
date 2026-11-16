---
'@scalar/workspace-store': minor
'@scalar/blocks': patch
---

Add `documentTypes` to `createWorkspaceStore`, so the store can ingest document formats it does not support natively. A registered type claims a document before the OpenAPI and AsyncAPI pipelines run, and the store keeps it as an opaque plugin document with `plugin` navigation entries built by the type.

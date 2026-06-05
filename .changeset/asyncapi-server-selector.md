---
'@scalar/api-reference': minor
---

feat(api-reference): add an AsyncAPI server selector

Adds a server selector for AsyncAPI documents in the API reference introduction. It mirrors the OpenAPI server selector but works with the AsyncAPI server shape (a named map of `host`/`protocol`/`pathname`), labelling each server with its constructed connection URL. Selection is local for now and is not yet persisted to the workspace store.

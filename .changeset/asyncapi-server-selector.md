---
'@scalar/api-reference': minor
'@scalar/workspace-store': minor
'@scalar/api-client': patch
'@scalar/types': patch
---

feat(api-reference): add an AsyncAPI server selector

Adds a server selector for AsyncAPI documents in the API reference introduction. It mirrors the OpenAPI server selector but works with the AsyncAPI server shape (a named map of `host`/`protocol`/`pathname`), labelling each server with its constructed connection URL.

Server selection and variable changes are now persisted to the workspace store via new `asyncapi-server:update:selected` and `asyncapi-server:update:variables` events and their mutators, mirroring the OpenAPI wiring.

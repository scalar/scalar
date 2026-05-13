---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
---

feat: support testing webhooks in the API client. `getRequestExampleContext` now resolves operations from `document.webhooks` when `isWebhook: true` is passed in `RequestExampleMeta`, and the modal sidebar routes webhook selections through the same operation pipeline used for paths.

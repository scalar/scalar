---
'@scalar/api-client': minor
'@scalar/workspace-store': patch
---

feat: add WebSocket channel operation UI for AsyncAPI documents

Introduce WebSocket testing experience for AsyncAPI channels in the API client.

**@scalar/api-client**

- Add `ChannelOperationBlock` and `ChannelOperation` feature: connect to a channel, edit path and query parameters, configure authentication, compose outgoing messages, and inspect a live message and connection log.
- Add `channel-operation` playground (`pnpm dev:channel-operation`) with an echo WebSocket fixture for local development.
- Apply selected security schemes to the connection URL on Connect (query `apiKey`, basic auth userinfo, bearer/OAuth `access_token`). Header-based API keys are reported as unsupported because browser `WebSocket` cannot set custom handshake headers.
- Export `applyAuthToWebSocketUrl` and related helpers from the channel-operation block.

**@scalar/workspace-store**

- Enable document-level auth mutators for AsyncAPI documents so authentication selections and secrets persist in the workspace store.
- Add `isWorkspaceDocument` type guard for shared document handling across OpenAPI and AsyncAPI shapes.

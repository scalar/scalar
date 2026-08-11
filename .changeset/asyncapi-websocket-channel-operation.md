---
'@scalar/api-client': minor
'@scalar/workspace-store': patch
'@scalar/sidebar': patch
---

feat: add WebSocket channel operations for AsyncAPI documents

Introduce a WebSocket testing experience for AsyncAPI channels in the API client.

**@scalar/api-client**

- Add `ChannelOperationBlock` and the `ChannelOperation` feature: connect to a channel, edit path and query parameters, configure authentication, compose outgoing messages, and inspect a live message and connection log.
- Render AsyncAPI channels in the API client modal. When the active document is AsyncAPI, its channels appear in the sidebar and selecting one opens the channel connection view alongside the existing OpenAPI operation flow.
- Build the connection URL from the current path and query parameters so edits in the parameter table change where the client connects.
- Apply selected security schemes to the connection URL on Connect (query `apiKey`, basic auth userinfo, bearer/OAuth `access_token`). Header-based API keys are reported as unsupported because browser `WebSocket` cannot set custom handshake headers.
- Add a `channel-operation` playground (`pnpm dev:channel-operation`) for local development.

**@scalar/workspace-store**

- Resolve the messages a client can send from the operations the server receives. AsyncAPI describes operations from the application's point of view, so a client-sent message belongs to a `receive` operation.

**@scalar/sidebar**

- Show AsyncAPI channels, operations, and messages in the client layout so channel entries are reachable in the API client sidebar.

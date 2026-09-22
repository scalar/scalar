---
'@scalar/mock-server': minor
'@scalar/mock-server-docker': patch
'@scalar/void-server': patch
'@scalar/hono-api-reference': patch
---

Update Hono and its Node.js server, WebSocket, and OpenAPI integration dependencies.

Replace the deprecated `@hono/node-ws` adapter with Node server v2 WebSocket support. `createAsyncApiMockServer()` now returns `websocket` instead of `injectWebSocket`. Start the server with `serve({ fetch: app.fetch, websocket })` instead of calling `injectWebSocket(server)`.

AsyncAPI callers must upgrade to `@hono/node-server` v2. Node server v1 ignores the `websocket` option, so WebSocket channels will silently stop accepting connections if the server dependency is not upgraded.

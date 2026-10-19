---
'@scalar/mock-server': minor
'@scalar/mock-server-docker': patch
'galaxy-scalar-com': patch
---

Unify OpenAPI and AsyncAPI mocking in createMockServer, detecting the document format after loading it. The factory returns a Hono app for either format. WebSocket channels now require a runtime-specific upgradeWebSocket adapter; Node hosts create their own WebSocketServer. This replaces the exported createAsyncApiMockServer factory and its result/options types.

Serve sample Galaxy events on connection in the existing Cloudflare Pages deployment.

Expand AsyncAPI server pathname enums and serve deployment-specific AsyncAPI JSON and YAML documents automatically.

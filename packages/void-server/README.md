# Scalar Void Server

[![Version](https://img.shields.io/npm/v/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fvoid-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

An Hono server that responds with the request data. Kind of a mirror for HTTP requests.

It's running on <https://void.scalar.com>, feel free to use it.

## Examples

- https://void.scalar.com/
- https://void.scalar.com/404
- https://void.scalar.com/foobar.html
- https://void.scalar.com/foobar.json
- https://void.scalar.com/foobar.xml
- https://void.scalar.com/foobar.zip
- https://void.scalar.com/?foo=bar&foo=rab
- ws://localhost:5052/any-path (WebSocket echo on any path; closes after 60s by default)

## Installation

```bash
npm add @scalar/void-server
```

## Usage

```ts
import { serve } from '@hono/node-server'
import { attachVoidWebSocket, createVoidServer } from '@scalar/void-server'

const app = createVoidServer()

const httpServer = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`)
    console.log(`WebSocket echo at ws://localhost:${info.port}/<any-path>`)
  },
)

attachVoidWebSocket(httpServer)
```

### WebSocket echo

Call `attachVoidWebSocket(httpServer)` to enable the WebSocket echo on an existing Node HTTP server. Connect with any path (for example `ws://localhost:3000/chat`) and the server echoes any text or binary frame back unchanged.

Calling `attachVoidWebSocket` more than once on the same HTTP server is ignored: the first call registers the upgrade listener and later calls return the same `WebSocketServer` without adding another listener. Options passed on later calls are not applied.

| Option | Description |
| --- | --- |
| `path` | Restrict accepted upgrades to a specific path. Defaults to accepting any path. |
| `connectionTimeoutMs` | Maximum connection lifetime. Falls back to the `VOID_WEBSOCKET_TIMEOUT_MS` env var, then to 60 seconds. |

```ts
attachVoidWebSocket(httpServer, {
  path: '/ws',
  connectionTimeoutMs: 30_000,
})
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/packages/void-server/LICENSE).

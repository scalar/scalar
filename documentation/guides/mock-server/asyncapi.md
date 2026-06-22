# AsyncAPI Mocking

The mock server can mock **event-driven APIs** described with an [AsyncAPI 3.1](https://www.asyncapi.com/) document, alongside its OpenAPI/REST support. Each AsyncAPI channel is served as a live mock endpoint that emits realistic messages generated from the channel's message payload schemas — the event-driven counterpart of the HTTP responses the REST mocker generates.

## Supported transports

| Transport | When it is used | Behavior |
| --- | --- | --- |
| **WebSocket** (`ws` / `wss`) | Channels whose servers use the `ws`/`wss` protocol (or declare a WebSocket binding). | `receive` operations push a generated message when a client connects; `send` operations echo a generated reply to each inbound frame. |
| **SSE** (`sse`, or `http`/`https` with a `receive` operation) | One-way, server-push channels over HTTP. | A `GET` on the channel route opens an SSE stream and emits a generated message per `receive` operation. |

> Brokered protocols such as Kafka, MQTT, and AMQP require external broker infrastructure and are not served in-process. They can be added through the [transports extension point](#adding-custom-transports).

## Usage

WebSocket channels need to be attached to the HTTP server after `serve()`, so `createAsyncApiMockServer` returns both the Hono `app` and an `injectWebSocket` function:

```typescript
import { serve } from '@hono/node-server'
import { createAsyncApiMockServer } from '@scalar/mock-server'

const document = {
  asyncapi: '3.1.0',
  info: { title: 'Chat', version: '1.0.0' },
  servers: {
    production: { host: 'localhost:3000', protocol: 'ws' },
  },
  channels: {
    messages: {
      address: 'messages',
      messages: {
        chatMessage: {
          contentType: 'application/json',
          payload: {
            type: 'object',
            properties: {
              user: { type: 'string' },
              text: { type: 'string' },
            },
            required: ['user', 'text'],
          },
        },
      },
    },
  },
  operations: {
    receiveMessage: { action: 'receive', channel: { $ref: '#/channels/messages' } },
    sendMessage: { action: 'send', channel: { $ref: '#/channels/messages' } },
  },
}

const { app, injectWebSocket } = await createAsyncApiMockServer({
  document,
  onMessage: ({ channel, direction, payload }) => console.log(direction, channel, payload),
})

const server = serve({ fetch: app.fetch, port: 3000 })

// Required for WebSocket channels to accept connections.
injectWebSocket(server)
```

Connect a WebSocket client to the channel route to receive a generated message and echo replies:

```bash
npx wscat -c ws://localhost:3000/messages
```

For an SSE channel, read the stream over HTTP:

```bash
curl -N http://localhost:3000/messages
```

## How messages are generated

For each message the mock server, in order of preference:

1. Uses a defined `examples` value, when present.
2. Otherwise generates a value from the message `payload` schema, using the same generator as the REST mocker.

Channel addresses with path parameters (for example `rooms/{roomId}`) become route parameters (`/rooms/:roomId`).

## Document detection

The Docker mock server and CLI automatically detect AsyncAPI documents (by their top-level `asyncapi` field) and start the AsyncAPI mock instead of the REST mock — no extra flag is required.

## Adding custom transports

Transports are pluggable. A transport declares which channels it owns via `supports()` and registers them via `register()`. The first transport whose `supports()` returns `true` for a channel owns it; built-in WebSocket and SSE transports are checked first.

```typescript
import { createAsyncApiMockServer, type MockTransport } from '@scalar/mock-server'

const signalrTransport: MockTransport = {
  name: 'signalr',
  supports: (channel) => channel.protocols.includes('signalr'),
  register: (channel, context) => {
    // `context` exposes the Hono `app` (for HTTP handshakes), Hono's `upgradeWebSocket`
    // helper (for socket upgrades), and `generateMessage(channel, messageId?)`.
    context.app.post(`${channel.route}/negotiate`, (c) => c.json({ /* ... */ }))
  },
}

const { app, injectWebSocket } = await createAsyncApiMockServer({
  document,
  transports: [signalrTransport], // appended after the built-in transports
})
```

Because `register()` receives both the Hono `app` and the `upgradeWebSocket` helper, protocols that negotiate over HTTP before upgrading to a socket (such as SignalR) fit without any core changes.

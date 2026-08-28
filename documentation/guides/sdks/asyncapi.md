# AsyncAPI

> [!NOTE]
> AsyncAPI support is experimental. It generates working code, but the surface it produces may change: talk to us before you depend on it.

The SDK generator reads [AsyncAPI](https://www.asyncapi.com/) documents as well as OpenAPI ones. Point it at an AsyncAPI document and it generates the same kind of client you get from OpenAPI — typed models, authentication, environments, a resource tree — with each channel exposed as a method on that tree.

The document format is detected from the file itself, so nothing extra needs to be configured. A document with an `asyncapi` field takes the AsyncAPI path, and one with an `openapi` field takes the OpenAPI path.

> [!NOTE]
> AsyncAPI support covers the WebSocket and HTTP halves of the specification. Broker protocols such as Kafka, AMQP, and MQTT are not generated for. See [Protocol support](#protocol-support) for what that means in practice, and [Limitations](#limitations) for the rest.

## Supported versions

AsyncAPI **1.x**, **2.x**, and **3.x** documents are all accepted. Anything below 3.x is upgraded to the 3.x shape on load, so the rest of generation only ever sees AsyncAPI 3 — `publish`/`subscribe` operations nested under a channel are lifted into the top-level `operations` map, and a server `url` is split into `protocol`, `host`, and `pathname`.

Both JSON and YAML are supported, and external `$ref` values are bundled before compilation, so a document split across several files works the same as a single-file one.

## Protocol support

A channel becomes exactly one method, and the protocol its servers speak decides what kind of method that is.

| Server `protocol` | What is generated |
| ----------------- | ----------------- |
| `ws`, `wss` | A **connect method** that opens a WebSocket and exposes typed send and receive events. |
| `http`, `https` | An ordinary **HTTP method** — a buffered request/response, or a stream when the messages say so. |
| Anything else (`kafka`, `amqp`, `mqtt`, `nats`, `redis`, …) | Nothing. The channel is skipped and reported. |

Channels are resolved to servers the way the specification prescribes: `channel.servers` narrows a channel to a subset, and a channel that declares no `servers` is treated as available on every server in the document.

A few consequences worth knowing:

- **A document where no channel speaks a supported protocol fails to load**, rather than quietly producing an SDK with no methods. The error names the protocols it found.
- **Mixed documents still generate.** A document with a `wss` channel and a `kafka` channel produces a client for the first and a warning for the second.
- **When a channel's servers disagree, declaration order wins.** A channel served over both `wss` and `kafka` becomes a WebSocket method, and `AsyncApi/AmbiguousProtocol` names what was dropped. Order the `servers` map — or scope the channel with `channel.servers` — to control which transport survives.
- **A channel's base URL is restricted to the servers matching its transport.** A WebSocket channel that inherits a document-wide server list will not be pointed at a Kafka broker's host.

## Send and receive

This is the part of AsyncAPI most worth understanding before you read a generated client.

AsyncAPI 3's `action` is written from the point of view of the application the document describes. Most published documents describe the **provider**, so `action: send` means *the server sends* — which is a message your SDK **receives**. The generator inverts by default, and gets you the client-side reading:

| Document says | SDK does |
| ------------- | -------- |
| `action: send` | Receives the message (an inbound event, or a response) |
| `action: receive` | Sends the message (an outbound event, or a request body) |

If your document is authored from the client's side instead, opt out per method:

```json
{
  "asyncapi": {
    "channel": "chat",
    "perspective": "client"
  }
}
```

`perspective` is `provider` by default. Getting it wrong swaps every send and receive type in the SDK while still type-checking cleanly, so it is worth verifying against one known message before you ship a client.

## Messages and payloads

Each direction of a channel is collapsed into a single type:

- **One message** in a direction lowers to that message's payload schema.
- **Several messages** lower to a union of their payloads. Where each branch carries a `const` or single-value `enum` (a `type` field, typically), the union is discriminated, so narrowing an incoming event by that field works in every target that has the concept.
- **Payloads are deduplicated.** Two messages that share a schema — `chat.created` and `chat.updated` both carrying `ChatEvent` — contribute one branch, not two.
- **A message with no payload contributes nothing.** An empty ping frame is legal and stays legal; it just does not widen the union to an untyped value and erase its siblings' types.
- A payload that is a `$ref` into `components.schemas` reuses the shared model rather than minting a duplicate type.

Operations narrow which messages belong to a method. A message reference on an operation is read against its channel's own `messages` map, so a message shared between channels is not pulled in through the wrong one, and an operation with no `messages` covers every message its channel declares.

### Schema formats

AsyncAPI lets a payload, message headers, or a `components.schemas` entry declare its dialect with `schemaFormat`, either inline or wrapped in a Multi Format Schema Object. JSON Schema is what the generator lowers, in every spelling of it:

- An absent `schemaFormat` (the default)
- `application/vnd.aai.asyncapi`, plus its `+json` and `+yaml` forms
- `application/vnd.oai.openapi`, plus its `+json` and `+yaml` forms
- `application/schema`, plus its `+json` and `+yaml` forms

A `version=` or `draft=` parameter on any of these is fine. Anything else — Avro, Protobuf, RAML data types — is replaced with an empty schema and reported as `Unsupported/AsyncApiSchemaFormat`: the message still generates, but its payload is untyped.

## WebSocket channels

A channel served over `ws`/`wss` becomes a connect method. The generated client holds the socket open, sends typed events, and iterates received ones.

```ts
const connection = client.chat.connect({
  roomId: 'general',
  'x-client-version': '1.4.0',
});

connection.send({ type: 'chat.message.send', body: 'Hello' });

try {
  for await (const event of connection) {
    if (event.type === 'chat.message.created') {
      console.log(event.body);
    }
  }
} finally {
  connection.close();
}
```

What feeds that method:

- **The channel address** is the endpoint, and every `{braced}` segment becomes a required path parameter. `channel.parameters` supplies each one's description, default, and allowed values — an AsyncAPI parameter is always a string substituted into the address, with an optional enum.
- **The `ws` binding** describes the handshake. Its `query` and `headers` object schemas become ordinary query parameters and headers on the connect call, with the schema's `required` list deciding which are mandatory. A binding on an operation refines the channel's, key by key.
- **Reconnection, send queueing, and raw frame access** come from the generated WebSocket runtime, the same one used for WebSocket operations declared in an OpenAPI document.
- The handshake is always a `GET`, because that is what a WebSocket upgrade is. A `ws` binding asking for another method is reported.

### Target support

WebSocket runtimes ship in **TypeScript**, **Python**, **Rust**, and the generated **CLI**. Other targets emit the event types but nothing that opens a connection, which is why generated starter configs gate every connect method to those four targets with `only`.

If you generate a target outside that list from an all-WebSocket document, you get `Unsupported/WebSocketMethod` per method and `AsyncApi/NoMethodsGenerated` for the target: models, auth, and a client, but nothing to call.

## HTTP channels

A channel served over `http`/`https` is not a socket. Its outbound messages become a request body and its inbound ones become the response, which makes it an ordinary HTTP method — routed through exactly the same request pipeline, pagination, and response handling as an operation from an OpenAPI document.

Whether it streams is decided by the media type its messages advertise, not guessed:

| Message `contentType` | Result |
| --------------------- | ------ |
| `text/event-stream` | Server-sent events, iterated as a stream |
| `application/x-ndjson` and other JSON Lines types | Newline-delimited JSON, iterated as a stream |
| `application/json` and other buffered types | A single decoded response |

```ts
const stream = await client.activity.stream();

for await (const record of stream) {
  console.log(record.kind);
}
```

Details that matter:

- **A direction is one wire.** All the messages travelling one way share a framing, so the first `contentType` stated by a payload-carrying message decides it. Any others are reported rather than silently discarded.
- **`defaultContentType` is the fallback**, and `application/json` is the fallback for that, exactly as the specification prescribes.
- **A media type no runtime decodes** — `application/xml`, say — still generates a method, and reports `Unsupported/AsyncApiContentType` to say the body comes back undecoded.
- **A request body is always required.** Unlike an OpenAPI request body, an AsyncAPI message either is the message or is not sent.
- **`streaming` and `paginated` in config still apply**, and a config `streaming` block overrides what the document implied.

Because the method's verb comes from its config rather than from the document, a channel with outbound payloads has to be configured with a verb that can carry a body. See [Limitations](#limitations).

## Servers, environments, and authentication

### Environments

Every server that declares both a `protocol` and a `host` becomes a named environment. The URL is reassembled from `protocol`, `host`, and `pathname`, with `variables` substituted from their defaults. The environment name comes from the server's `title`, falling back to the key it is declared under — so a second environment reads as `staging` rather than a positional name.

```yaml
servers:
  production:
    host: chat.example.com
    protocol: https
    pathname: /v1
    title: Production
```

```json
{
  "environments": {
    "production": "https://chat.example.com/v1"
  }
}
```

A single `https` base URL serves both transports: HTTP methods use it as-is, and the WebSocket runtime rewrites the scheme before it dials. Declaring the HTTP server first is usually what you want.

### Authentication

AsyncAPI has no root-level `security`. Each server declares its own alternatives instead, and the specification is explicit that only one alternative needs to be satisfied — so the SDK's authentication is the union of every dialable server's `security`, with each alternative becoming one requirement.

A credential is generated as **required** only when it is the sole alternative on every server the client can reach. Anything else is optional, so a client can be constructed with the one credential you actually hold.

Four scheme families lower into credentials:

| AsyncAPI scheme | Generated credential |
| --------------- | -------------------- |
| `httpApiKey` | An API key in a header, query parameter, or cookie |
| `http` | HTTP authentication, including `bearer` and `basic` |
| `oauth2` | OAuth 2.0, with `availableScopes` read as the scope list |
| `openIdConnect` | OpenID Connect |

Mind the `apiKey` trap. AsyncAPI spends that name on a key identifying the client to a **broker**, with no HTTP position to put it in — so `type: apiKey` generates nothing. The spelling that becomes an ordinary API key credential is **`httpApiKey`**, which carries the `name` and `in` pair a client needs:

```yaml
components:
  securitySchemes:
    apiKey:
      type: httpApiKey
      name: Authorization
      in: header
```

The remaining families — `userPassword`, `X509`, `symmetricEncryption`, `asymmetricEncryption`, `scramSha256`, `scramSha512`, `gssapi`, `plain`, and AsyncAPI's own `apiKey` — authenticate a broker connection rather than a request. There is no header, query parameter, or token flow for an HTTP-shaped client to send, so no credential is generated and `Unsupported/AsyncApiSecurityScheme` says so.

One more thing to watch: `server.security` holds whole Security Scheme Objects where OpenAPI holds names, and a credential needs a name to be generated under. Reference your schemes rather than writing them inline:

```yaml
servers:
  production:
    host: chat.example.com
    protocol: wss
    security:
      - $ref: '#/components/securitySchemes/apiKey' # named — generates a credential
```

An inline copy is reported as `AsyncApi/UnnamedSecurityScheme` and generates nothing, even when it matches a declared scheme exactly.

## Configuration

As with OpenAPI, the config is the source of truth for the SDK's public shape: a channel reaches the client through a method that binds it, never by being walked out of the document. The generated starter config gives every channel a resource of its own, with a single method on it and the component schemas its messages reach claimed as that resource's models.

```json
{
  "resources": {
    "chat": {
      "models": {
        "chat_message_send": "#/components/schemas/ChatMessageSend",
        "chat_message_created": "#/components/schemas/ChatMessageCreated"
      },
      "methods": {
        "connect": {
          "kind": "websocket",
          "endpoint": "get /chat/{roomId}",
          "verb": "get",
          "path": "/chat/{roomId}",
          "only": ["typescript", "python", "rust", "cli"],
          "asyncapi": { "channel": "chat" }
        }
      }
    }
  }
}
```

The resource is named after the channel's `title`, falling back to the first segment of its address and then to the channel id. Its endpoint path is the channel's `address`, or `/<channelId>` when the channel declares none. Component schemas no channel reaches are parked under a `$shared` resource rather than dropped, since an AsyncAPI `components.schemas` entry is a payload model however it is reached.

### The `asyncapi` method block

| Property | Description |
| -------- | ----------- |
| `channel` | **Required.** The `channels` key this method binds to. |
| `operations` | Operation ids folded into this method. Omit to bind every operation targeting the channel. |
| `perspective` | `provider` (default) or `client`. Whose point of view the document's `action` values are written from. |

Everything else about the method is ordinary config. Rename it with `name`, gate it per target with `only`/`skip`, give it `defaultRequestOptions`, or point an HTTP channel at a `paginated` scheme — all of it works exactly as it does for an operation from an OpenAPI document.

Narrowing a method to a subset of its channel's operations is the one AsyncAPI-specific knob you are likely to reach for:

```json
{
  "asyncapi": {
    "channel": "chat",
    "operations": ["publishChatEvents"]
  }
}
```

A channel the document declares but no method binds is reported as `AsyncApi/ChannelNotConfigured` — the drift a regenerated config would close.

## Diagnostics

Every AsyncAPI-specific rule, gradable and suppressible through the [`diagnostics`](configuration.md#diagnostics) config like any other:

| Rule | Default | Fires when |
| ---- | ------- | ---------- |
| `Unsupported/AsyncApiProtocol` | `warn` | A channel's servers all speak a protocol with no generated transport. |
| `Unsupported/AsyncApiSchemaFormat` | `warn` | A payload or schema declares a `schemaFormat` that is not JSON Schema. |
| `Unsupported/AsyncApiSecurityScheme` | `info` | A security scheme family has no HTTP-shaped credential to generate. |
| `Unsupported/AsyncApiContentType` | `warn` | An HTTP channel's messages state a media type no runtime decodes. |
| `Unsupported/AsyncApiFeature` | `info` | The channel declares something not modelled yet. The specific gap rides in `data.feature`. |
| `Unsupported/WebSocketMethod` | `warn` | A connect method is generated for a target with no WebSocket runtime. |
| `AsyncApi/AmbiguousProtocol` | `warn` | A channel's servers disagree on protocol; names which one won. |
| `AsyncApi/ChannelNotConfigured` | `warn` | The document declares a channel no configured method binds. |
| `AsyncApi/NoMethodsGenerated` | `warn` | A target ends up with models and a client but no methods. |
| `AsyncApi/OperationNotFound` | `warn` | `asyncapi.operations` names ids no operation on the channel answers to. |
| `AsyncApi/UnnamedSecurityScheme` | `warn` | A server states a security scheme inline instead of referencing one. |
| `AsyncApi/UnsendablePayload` | `warn` | An HTTP channel's outbound payloads sit on a verb that cannot carry a body. |
| `AsyncApi/TransformationsIgnored` | `info` | `openapi.transformations` is configured for a document that is not OpenAPI. |

## Limitations

Parts of the specification that are read and reported rather than generated. Most surface as `Unsupported/AsyncApiFeature` with the gap named in `data.feature`.

**Not modelled yet**

- **Request/reply** (`operation.reply`). The operation lowers as a plain send; the reply channel contributes no response or event type.
- **Message and operation traits.** Traits are not merged into the method or the event types.
- **Per-message headers.** They describe one frame on the wire rather than the call that opens the connection, so they do not become parameters.
- **Correlation ids.**
- **HTTP bindings.** A channel served over HTTP states its query parameters and status codes in `bindings.http`; none of it is lowered onto the method. The verb in particular cannot be honored, because the method is keyed by the verb its config declares.
- **Form media types.** `multipart/form-data` and `application/x-www-form-urlencoded` need per-field encoding a message payload has nowhere to carry, so the body is sent as JSON.
- **Channels no operation targets.** AsyncAPI 3 moved direction onto operations, so a channel whose `messages` no operation references generates a method carrying none of them.

**Known gaps in the generated starter config**

The starter config a first run writes has two rough edges for HTTP channels, both fixable by hand and both reported:

- Every channel is written with `"verb": "get"`. A channel whose SDK-sent messages carry payloads needs a body-carrying verb — change it to `post` — or those payloads are dropped, which is what `AsyncApi/UnsendablePayload` reports.
- Every channel is gated with `only: ["typescript", "python", "rust", "cli"]`, including HTTP channels that every target could generate. Remove the gate on those channels to generate them everywhere.

**Not produced**

- **No augmented API document.** Generation from an OpenAPI document writes an `openapi.augmented.json` carrying `x-codeSamples` for every target. There is no AsyncAPI counterpart yet, so an AsyncAPI-backed SDK produces no augmented document and injects no code samples back into your document.

## Rendering AsyncAPI

Scalar also renders AsyncAPI documents as interactive reference documentation. See [AsyncAPI in API References](../../asyncapi.md) for what renders, protocol and server filtering, and authentication support there.

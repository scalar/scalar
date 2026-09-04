# AsyncAPI

AsyncAPI is the event-driven counterpart to OpenAPI. An OpenAPI document describes endpoints you call and the responses you get back; an [AsyncAPI](https://www.asyncapi.com/) document describes **channels** you connect to and the **messages** that flow over them — WebSocket streams, Kafka topics, MQTT subjects, server-sent events, and more.

If your API pushes data instead of waiting to be asked for it, AsyncAPI is the format that describes it, and Scalar renders it as an API reference exactly like it renders OpenAPI.

Want to see one before you write one? The [Scalar Galaxy Events reference](https://galaxy.scalar.com/#scalar-galaxy-events-asyncapi) is rendered straight from [this AsyncAPI document](https://github.com/scalar/scalar/blob/main/packages/galaxy/src/documents/asyncapi/3.0.yaml).

> [!NOTE]
> AsyncAPI support is still a work in progress, so not every part of the specification is rendered yet. If something you need is missing, [open an issue](https://github.com/scalar/scalar/issues/new) or [come tell us on Discord](https://discord.gg/scalar).

<scalar-image
  src="/asyncapi-channel.png"
  src-dark="/asyncapi-channel-dark.png"
  alt="An AsyncAPI reference rendered by Scalar, with channels and their operations in the sidebar"
  size="full">
</scalar-image>

## Rendering a document

You can load AsyncAPI documents the same way you load OpenAPI documents:

```javascript
Scalar.createApiReference('#app', {
  url: '/asyncapi.json'
})
```

Everything else works the same way too: pass the document [as a URL or as content](configuration.md), render it [alongside your OpenAPI documents](configuration.md#multiple-documents) in one reference, or add it to a Docs project with an [`asyncapi` navigation entry](guides/docs/configuration/navigation.md#asyncapi).

## Coming from OpenAPI

The concepts line up closely, they just have different names:

| OpenAPI | AsyncAPI | In the reference |
| ------- | -------- | ---------------- |
| Path (`/planets/{planetId}`) | Channel (`planets/{planetId}/events`) | A sidebar entry with its address, description, and parameters |
| Operation (`get`, `post`) | Operation with an `action` of `send` or `receive` | Nested under its channel, labelled with the action |
| Request and response bodies | Message payloads | Collapsible message accordions under the operation |
| `servers[].url` | `servers[].host`, `pathname`, and `protocol` | Server and protocol labels on the channel |
| Root-level `security` | The union of every server's `security` | The authentication selector in the introduction |
| `components.schemas` | `components.schemas` | The Models section |

The biggest thing to know: `action` is written from the point of view of the application the document describes. `receive` means that application receives the message (you send it), and `send` means it sends one to you.

## An example document

A minimal AsyncAPI 3.0 document with one server, one channel, one operation, and one message:

```yaml
asyncapi: 3.0.0
info:
  title: Scalar Galaxy Events
  version: 1.0.0
servers:
  production:
    host: galaxy.scalar.com
    pathname: /ws/v1
    protocol: wss
    description: Production WebSocket server
channels:
  planetEvents:
    address: planets/{planetId}/events
    title: Planet Events
    summary: Real-time event stream for a single planet.
    parameters:
      planetId:
        description: The planet to watch.
    messages:
      planetUpdated:
        $ref: '#/components/messages/PlanetUpdated'
operations:
  subscribeToPlanetEvents:
    action: receive
    title: Subscribe to Planet Events
    channel:
      $ref: '#/channels/planetEvents'
    messages:
      - $ref: '#/channels/planetEvents/messages/planetUpdated'
components:
  messages:
    PlanetUpdated:
      title: Planet Updated
      summary: A planet was updated.
      payload:
        type: object
        properties:
          id:
            type: integer
          name:
            type: string
          updatedAt:
            type: string
            format: date-time
```

That renders as a **Planet Events** channel carrying a `wss` label, with **Subscribe to Planet Events** nested underneath it and the **Planet Updated** message collapsed below that.

The full document behind the Galaxy example is available at [`packages/galaxy/src/documents/asyncapi/3.0.yaml`](https://github.com/scalar/scalar/blob/main/packages/galaxy/src/documents/asyncapi/3.0.yaml).

## Supported versions

The reference renders against the AsyncAPI **3.x** shape. Older documents are upgraded automatically on load, so you can pass a **1.x** or **2.x** document and it renders the same way — there's nothing extra to configure.

Behind the scenes the document is converted to the latest 3.x version (for example `subscribe`/`publish` operations nested under a channel are lifted into the top-level `operations` map, and a server `url` is split into `host` and `pathname`). The original version is preserved on the document as `x-original-aas-version` for reference.

## What renders

The reference renders the AsyncAPI document grouped by channel. For each channel you'll see:

- The channel title (or address) and description.
- **Server** and **protocol** labels for the channel: the servers it's available on (from `document.servers`, restricted to `channel.servers` when declared) and their protocols (for example `wss`, `kafka`).
- The channel address **parameters**.
- Each **operation** on the channel, nested beneath it, with its `send`/`receive` action, title, and summary/description.
- Each **message** under its operation, shown as a collapsible accordion. The message header shows **protocol** labels for every protocol it's carried over — its channel's server protocols unioned with any protocols it declares its own `bindings` for. Expanding a message reveals its description and its **headers** and **payload** schemas. Messages start collapsed and stay in sync with the sidebar, so selecting a message in the navigation (or opening a deep link to it) expands it here too.

Reusable schemas defined under `components.schemas` are rendered in the **Models** section, just like OpenAPI.

Rendering works in both the `modern` and `classic` layouts.

<scalar-image
  src="/asyncapi-message.png"
  src-dark="/asyncapi-message-dark.png"
  alt="An expanded message accordion showing the payload schema of an event"
  size="full">
</scalar-image>

## Filtering by protocol and server

When a document defines more than one protocol or server, **filter pickers** appear at the top of the sidebar, stacked beneath the document picker and working just like it:

- **Protocol** — shown when the servers use more than one `protocol` (for example a `wss` WebSocket server alongside an `mqtt` or `kafka` server). Selecting a protocol hides operations that aren't reachable over a server using it.
- **Server** — shown when the document defines more than one server. Selecting a server hides operations whose channel isn't reachable through it.

Both filters operate on the navigation tree itself: operations that don't match are hidden, and any channel or tag left empty is dropped. Channels that declare no `servers` are treated as available on every server (and therefore every protocol). Choosing **All protocols** / **All servers** clears that filter, and the filters reset when you switch documents.

Each picker is only shown when there is more than one option to choose from.

<scalar-image
  src="/asyncapi-protocol-filter.png"
  src-dark="/asyncapi-protocol-filter-dark.png"
  alt="The protocol filter open in the sidebar, listing all protocols, WS, and WSS"
  size="full">
</scalar-image>

## Authentication

Document-wide authentication is rendered the same way as OpenAPI. When the document defines `components.securitySchemes`, an **Authentication** selector appears in the introduction, listing every scheme so you can fill in credentials.

Because AsyncAPI has no root-level `security`, the document-wide requirements are derived from the union of every server's `security` (a server applies to the whole connection). Operation- and channel-level auth is not surfaced yet — it needs more design and is tracked as a follow-up.

The selector fully supports the security scheme types that AsyncAPI shares with OpenAPI:

- `http` (for example `bearer` and `basic`)
- `oauth2`
- `openIdConnect`
- `apiKey`
- `httpApiKey` (a named key in `query`, `header`, or `cookie`; rendered as an `apiKey`)

The broker-specific scheme types have dedicated credential inputs too:

- `userPassword`, `plain`, `scramSha256`, `scramSha512` — a **username** and **password** pair, just like HTTP basic.
- `X509` — a **client certificate** and **private key** (PEM).
- `symmetricEncryption`, `asymmetricEncryption` — a single **key** value.
- `gssapi` — the Kerberos **service name** to authenticate against.

Credentials are kept in the auth store alongside the OpenAPI ones, so they persist while you browse and never leave the browser.

<scalar-image
  src="/asyncapi-authentication.png"
  src-dark="/asyncapi-authentication-dark.png"
  alt="The authentication selector listing the security schemes declared by the document"
  size="full">
</scalar-image>

## Mocking an event-driven API

The [mock server](guides/mock-server/asyncapi.md) serves an AsyncAPI document as live endpoints: WebSocket channels push generated messages when a client connects, and one-way HTTP channels are served as an SSE stream. Message payloads are generated from the schemas in the document, so you can build against the API before it exists.

## Generating SDKs

The same document can generate a client. The [Scalar SDK Generator](guides/sdks/asyncapi.md) turns each channel into a WebSocket connect method or an HTTP streaming method, with typed send and receive events. AsyncAPI input to the SDK Generator is experimental.

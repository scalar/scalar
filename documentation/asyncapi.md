# AsyncAPI

AsyncAPI is the event-driven counterpart to OpenAPI. An OpenAPI document describes endpoints you call and the responses you get back; an [AsyncAPI](https://www.asyncapi.com/) document describes **channels** you connect to and the **messages** that flow over them — WebSocket streams, Kafka topics, MQTT subjects, server-sent events, and so on.

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

- The channel title (or address), summary, and description. A separate **Address** row preserves the actual address when a title is present. Missing or null addresses display **Unknown**; the channel identifier is only a heading fallback.
- **Server** and **protocol** labels for the channel: the servers it's available on (from `document.servers`, restricted to `channel.servers` when declared) and their protocols (for example `wss`, `kafka`).
- The channel address **parameters**.
- Each **operation** on the channel, nested beneath it, with its `send`/`receive` action, title, and summary/description.
- A **Channel messages** catalog containing every visible message defined on the channel, including messages that no operation lists. Channels with messages render even when they have no operations.
- Each **message** under its operation, shown as a collapsible accordion. The message header preserves the authored **name**, including names inherited from message traits, alongside its heading. The message map key is not used as a substitute for a missing name. The header also shows **protocol** labels for every protocol it's carried over — its channel's server protocols unioned with any protocols it declares its own `bindings` for. Expanding a message reveals its description and its **headers** and **payload** schemas. Messages start collapsed and stay in sync with the sidebar, so selecting a message in the navigation (or opening a deep link to it) expands it here too.

Channels remain visible when no operation references them. Their messages appear directly beneath the channel, with the same schemas, examples, and navigation links as operation messages. Channels without messages remain visible too. Channels whose operations are all hidden with `x-internal` or `x-scalar-ignore` remain hidden.

An operation lists only its supported messages. Omitting its `messages` property includes every channel message; setting `messages: []` includes none. The channel catalog does not change these operation subsets.

Request/reply operations show a **Replies** section with the reply channel, its static address or a dynamic address expression, and the declared reply messages. The channel and address share a compact card header, with expandable reply message schemas below. Operations with replies keep Messages before Replies and show an empty state when no messages are listed. Channel links and message copy links lead to their existing documentation. Dynamic expressions describe where the address comes from at runtime; they are displayed without evaluation. Referenced reply objects and reply addresses are supported.

Reusable schemas defined under `components.schemas` are rendered in the **Models** section, just like OpenAPI.

Multi Format Schema Objects use `schemaFormat` to choose how to display their schema. JSON Schema, AsyncAPI Schema, and OpenAPI Schema formats use the structured schema renderer. Avro, Protobuf, and other formats appear as copyable source with their declared format, in message payloads, headers, and reusable models. Structured source such as Avro is formatted as JSON; text such as Protobuf keeps its original whitespace. Source-only formats do not provide generated examples or field-level search and correlation links.

Rendering works in both the `modern` and `classic` layouts.

<scalar-image
  src="/asyncapi-message.png"
  src-dark="/asyncapi-message-dark.png"
  alt="An expanded message accordion showing the payload schema of an event"
  size="full">
</scalar-image>

## Protocol bindings

Binding details appear on channels, operations, and expanded messages, and beneath the selected server in the introduction. Each binding shows its protocol key and all supplied fields, including `bindingVersion` when declared. Expand nested fields to inspect their JSON.

Referenced bindings and bindings inherited from operation or message traits are supported. Unfamiliar fields remain visible; unavailable references retain their `$ref` pointer. Binding versions describe the binding format and are separate from the server's protocol version.

## Search

Search finds channels, operations, and messages by their titles, names, summaries, and descriptions. Channel addresses and parameter names and descriptions are searchable too. Channel, operation, and message results display the actual channel address, or **Address: Unknown** when it is missing or null. Channel identifiers remain searchable independently of the address. For messages, search also includes payload and application-header field names and descriptions, including nested objects and array items in supported JSON Schema formats.

Select a result to navigate to its content. Selecting a message opens its accordion. Search shows each message once per channel, opening its channel-catalog entry. Search covers the full document; selecting a result hidden by a protocol or server filter clears those filters to reveal its content.

## Payload examples

Messages display their `contentType`, falling back to the document’s `defaultContentType` when omitted. Payload examples use JSON, XML, or YAML highlighting for those media types and plain text otherwise. Authored non-JSON strings keep their original formatting. Examples with both headers and payload show separate blocks with independent copy buttons. Structured non-JSON values are labeled as structure only, not encoded messages. When neither content type is declared, examples keep the existing JSON formatting.

Message-level `examples` appear in a code panel with a copy button and a picker when there is more than one example. Examples inherited from message traits are supported too.

When no message example contains a payload, Scalar generates a representative payload from its JSON Schema automatically. Schema examples, defaults, and enum values are used by the shared example generator. The panel labels this fallback **Generated example**. Header-only examples remain available separately.

Generation supports native JSON Schema payloads and JSON Schema or AsyncAPI Schema wrappers. Other schema formats, such as Avro, and boolean payload schemas do not generate examples. Generated values illustrate the payload structure; they are not guaranteed to satisfy every JSON Schema constraint.

The server selector shows each server title alongside its connection URL, falling back to the server map key when no title is provided. The selected server also shows its summary, protocol version, and description when provided. Selection and variable updates continue to use the server map key.

## Tags

Tags appear on the application introduction, selected server, channels, operations, and messages. Expand a tag with a description or external documentation to read its details. Referenced tags and tags inherited from operation or message traits are supported. Explicit tag arrays replace inherited arrays, including an empty array.

The **Tag** picker appears in the modern sidebar or above the content in classic layout. It lists tags from servers and visible channels, operations, and messages. Application tags appear in the introduction but do not add filter options or match content, even when they share a name with a channel, operation, or message tag. Selecting a tag narrows navigation while keeping channel grouping:

- Server tags match content reachable through a server carrying that tag.
- Channel and operation tags retain their matching section and its children.
- Message tags retain matching messages with their operation and channel as context.

Tag filtering combines with the protocol and server filters. A server-tag match must satisfy both selections. Choosing **All tags** clears the tag filter. Filters reset when switching documents, and selecting a search result hidden by a filter clears the filters to reveal it. Tag names are matched exactly, and identical names across scopes share a filter option.

## Filtering by protocol and server

When a document defines more than one protocol or server, **filter pickers** appear at the top of the sidebar, stacked beneath the document picker and working just like it:

- **Protocol** — shown when the servers use more than one `protocol` (for example a `wss` WebSocket server alongside an `mqtt` or `kafka` server). Selecting a protocol hides operations that aren't reachable over a server using it.
- **Server** — shown when the document defines more than one server. Selecting a server hides operations whose channel isn't reachable through it.

Both filters operate on the navigation tree itself: operations and channel catalog messages that do not match are hidden, and their channel or tag is dropped when filtering removes all its children. Channels without operations are filtered using their own server availability, including channels without messages. Channels with an absent or empty `servers` list are treated as available on every server (and therefore every protocol). Choosing **All protocols** / **All servers** clears that filter, and the filters reset when you switch documents.

Each picker is only shown when there is more than one option to choose from.

<scalar-image
  src="/asyncapi-protocol-filter.png"
  src-dark="/asyncapi-protocol-filter-dark.png"
  alt="The protocol filter open in the sidebar, listing all protocols, WS, and WSS"
  size="full">
</scalar-image>

## Authentication

Document-wide authentication is rendered the same way as OpenAPI. When the document defines component security schemes or inline server security, an **Authentication** selector appears in the introduction, listing every scheme so you can fill in credentials.

Because AsyncAPI has no root-level `security`, the document-wide requirements are derived from the union of every server's `security` (a server applies to the whole connection). Connection authentication uses the selected server’s security. Each operation has an authentication badge that opens the same details tooltip used for OpenAPI, showing its security schemes and required OAuth scopes. Alternatives within each list mean any one scheme can satisfy that list; operation security applies in addition to server security. Inline declarations do not need matching `components.securitySchemes` entries.

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

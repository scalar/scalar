# AsyncAPI Specification

We're in the process of adding [AsyncAPI](https://www.asyncapi.com/) support.

You can load AsyncAPI documents the same way you load OpenAPI documents:

```javascript
Scalar.createApiReference('#app', {
  url: '/asyncapi.json'
})
```

## Supported versions

The reference renders against the AsyncAPI **3.x** shape. Older documents are upgraded automatically on load, so you can pass a **1.x** or **2.x** document and it renders the same way — there's nothing extra to configure.

Behind the scenes the document is converted to the latest 3.x version (for example `subscribe`/`publish` operations nested under a channel are lifted into the top-level `operations` map, and a server `url` is split into `host` and `pathname`). The original version is preserved on the document as `x-original-aas-version` for reference.

## What renders

The reference renders the AsyncAPI document grouped by channel. For each channel you'll see:

- The channel title (or address) and description.
- **Server** and **protocol** labels for the channel: the servers it's available on (from `document.servers`, restricted to `channel.servers` when declared) and their protocols (for example `wss`, `kafka`).
- The channel's **tags** and **external documentation** link.
- The channel address **parameters**.
- The channel **bindings** (see [Protocol bindings](#protocol-bindings) below).
- Each **operation** on the channel, nested beneath it, with its `send`/`receive` action, title, and summary/description.

Each operation also shows:

- A **security** badge in its header when the operation declares `security` (resolved against `components.securitySchemes`, including any requirements inherited from its servers).
- Its **tags** and **external documentation** link.
- Its **bindings**.
- Its **reply**, for request/reply operations — the reply channel address, the reply address `location`/`description`, and the reply message names.

Each **message** is shown under its operation as a collapsible accordion. The message header shows **protocol** labels for every protocol it's carried over — its channel's server protocols unioned with any protocols it declares its own `bindings` for. Expanding a message reveals:

- Its description, **tags**, and **external documentation** link.
- Its **headers** and **payload** schemas.
- Its **correlation ID** (location and description).
- Its **examples** (each example's name/summary with the example payload and headers).
- Its **bindings**.

Messages start collapsed and stay in sync with the sidebar, so selecting a message in the navigation (or opening a deep link to it) expands it here too.

Reusable schemas defined under `components.schemas` are rendered in the **Models** section, just like OpenAPI.

## Protocol bindings

[Bindings](https://www.asyncapi.com/docs/reference/specification/v3.1.0#operationBindingsObject) are rendered on servers' channels, operations, and messages. Each protocol declared in a `bindings` object is shown as a labeled group with its fields listed as key/value pairs — simple values inline, and structured values (such as a binding's `headers` or `query` schema) as formatted JSON.

All protocols defined by AsyncAPI are displayed generically (for example `kafka`, `amqp`, `mqtt`, `ws`, `sns`, `sqs`, and the rest), so a binding's configuration is always visible even for protocols without a dedicated, schema-aware view.

Rendering works in both the `modern` and `classic` layouts.

## Filtering by protocol and server

When a document defines more than one protocol or server, **filter pickers** appear at the top of the sidebar, stacked beneath the document picker and working just like it:

- **Protocol** — shown when the servers use more than one `protocol` (for example a `wss` WebSocket server alongside an `mqtt` or `kafka` server). Selecting a protocol hides operations that aren't reachable over a server using it.
- **Server** — shown when the document defines more than one server. Selecting a server hides operations whose channel isn't reachable through it.

Both filters operate on the navigation tree itself: operations that don't match are hidden, and any channel or tag left empty is dropped. Channels that declare no `servers` are treated as available on every server (and therefore every protocol). Choosing **All protocols** / **All servers** clears that filter, and the filters reset when you switch documents.

Each picker is only shown when there is more than one option to choose from.

> [!NOTE]
> AsyncAPI support is still a work in progress, so not every part of the specification is rendered yet. The progress is tracked on GitHub in [issue #7080](https://github.com/scalar/scalar/issues/7080) — subscribe there to receive updates.

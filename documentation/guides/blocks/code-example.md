# Code Example

The Code Example block renders a copy-pasteable request snippet for a single operation. It comes with a client picker (curl, Node, Python, and more) and, when the operation has multiple request examples, an example selector — exactly like the snippets in a full API reference.

The block mounts itself into a DOM element, so you do not need to set up Vue yourself.

## JavaScript usage

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createCodeExample } from '@scalar/blocks/code-example'
import '@scalar/blocks/style.css'

// See Getting Started for installation and the target HTML element.
const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

const block = createCodeExample('#code-example', {
  store,
  path: '/users/{id}',
  method: 'get',
})

// Later, when the block is no longer needed
block.destroy()
```

`createCodeExample` accepts either a CSS selector or an `HTMLElement` as its first argument. It throws if the element cannot be found, or if the `path` and `method` do not point at an operation in the store.

See [Getting Started](getting-started.md) for a complete inline API description. For this example, serve an API description containing `GET /users/{id}` at `/openapi.json`.

## Mounting helper options

| Option                  | Type                           | Description                                                                                                                                                                                 |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`                 | `WorkspaceStore`               | **Required.** The workspace store that holds the OpenAPI document(s) to render from.                                                                                                        |
| `path`                  | `string`                       | **Required.** Path of the operation to render, e.g. `/users/{id}`.                                                                                                                          |
| `method`                | `string`                       | **Required.** HTTP method of the operation to render.                                                                                                                                       |
| `selectedClient`        | `AvailableClients[number]`     | Pre-selected client ID, e.g. `shell/curl`.                                                                                                                                                  |
| `selectedServer`        | `ServerObject \| null`         | Server override used to build the example. When omitted, the server is derived from the active document (operation, then path item, then document level). Pass `null` to force "no server". |
| `selectedExample`       | `string`                       | Pre-selected example key for parameters and the request body.                                                                                                                               |
| `securitySchemes`       | `SecuritySchemeObjectSecret[]` | Security schemes applicable to the operation.                                                                                                                                               |
| `codeSampleUnavailable` | `string`                       | Localized status text when the selected example has no linked code sample.                                                                                                                  |
| `codeSampleLabel`       | `string`                       | Localized accessible name for the focusable code sample.                                                                                                                                    |
| `darkMode`              | `boolean`                      | Force a color mode. When omitted, the block inherits the ambient theme of the host page.                                                                                                    |

## Active document and servers

The helper resolves `path` and `method` from the store's active OpenAPI document. It does not search every loaded document. A missing element or operation throws during mounting. If the active document later changes and lacks that operation, the block keeps the last successfully resolved operation and its server.

Without `selectedServer`, the helper uses servers from the operation, then the path item, then the document. An explicit server override wins over those values; `null` suppresses the server.

## The store is the source of truth

The client and example selections round-trip through the store. Once a user picks a client or an example, that choice is written back to the store (`x-scalar-default-client` and `x-scalar-default-example`) and wins over the initial `selectedClient` / `selectedExample` seed.

This means selections survive re-renders and stay in sync across every block reading from the same store — pick a client in one block and the others follow.

## Cleaning up

`createCodeExample` returns the underlying Vue `app` and a `destroy` function. Call `destroy()` to unsubscribe the block from the store and unmount it.

```ts
const block = createCodeExample('#code-example', {
  store,
  path: '/hello',
  method: 'post',
})

block.destroy()
```

## Vue usage

In a Vue application, you can use the same mounting helper and let it handle the store subscriptions. This component accepts an already loaded store; it mounts after the target exists and cleans up before unmounting:

```vue
<script setup lang="ts">
import { createCodeExample } from '@scalar/blocks/code-example'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import '@scalar/blocks/style.css'

const { store } = defineProps<{ store: WorkspaceStore }>()
const target = ref<HTMLElement | null>(null)
let block: ReturnType<typeof createCodeExample> | undefined

onMounted(() => {
  if (target.value) {
    block = createCodeExample(target.value, {
      store,
      path: '/hello',
      method: 'get',
    })
  }
})

onBeforeUnmount(() => block?.destroy())
</script>

<template>
  <div ref="target" />
</template>
```

For full control, the same entry point exports the `CodeExample` Vue component and `CodeExampleProps`. Its API differs from the mounting helper: pass a resolved `operation`, `path`, `method`, `clientOptions`, `eventBus`, and `securitySchemes` instead of `store`. Build client options with `generateClientOptions()` and the event bus with `createWorkspaceEventBus()` from `@scalar/workspace-store/events`.

When using the component directly, your host must update the selected props in response to `workspace:update:selected-client` and `workspace:update:selected-example` events. It must also provide the style and teleport wrappers described in [Getting Started](getting-started.md#styles-and-vue-components). Prefer the helper when you want these integrations handled for you.

## AsyncAPI operations

For AsyncAPI 3.x, pass an `operationName` instead of an HTTP `path` and `method`:

```ts
createCodeExample('#code-example', {
  store,
  operationName: 'sendUpdate',
})
```

The active workspace document supplies the operation, channel, and servers. In Vue, use
`AsyncApiCodeExample` from `@scalar/blocks/code-example` with `document` and `operationName`
props. Pass a workspace-resolved document so references can be followed.

Add authored samples to an operation with `x-codeSamples` (or `x-code-samples`):

```yaml
asyncapi: 3.1.0
info:
  title: Updates
  version: 1.0.0
servers:
  production:
    host: events.example.com
    protocol: wss
channels:
  updates:
    address: /updates
    messages:
      updated:
        name: Updated
        examples:
          - name: Ada
            payload: { name: Ada }
          - name: Grace
            payload: { name: Grace }
operations:
  sendUpdate:
    action: send
    channel:
      $ref: '#/channels/updates'
    x-codeSamples:
      - lang: python
        label: Python SDK
        source: client.send_update(name="Ada")
```

Authored samples are displayed unchanged and work with any protocol. Select
**JavaScript WebSocket** to generate browser code for a `ws` or `wss` server.
The message picker respects the operation's `messages` list; an omitted list uses
all channel messages, while an empty list uses none. The example picker selects
an authored message payload. Missing payloads produce an explicit placeholder.

Generated examples follow the described application's direction: `send` sends after
connecting, and `receive` listens for incoming data. JSON payloads are serialized;
text payloads are sent as strings. Other encodings need application-specific code.
Message headers, authentication, and reply correlation require application-specific
setup. No connection is opened by the block.

Use `selectedServer` to select a server by name. By default, the block follows the
document's selected server when available, falling back to the first eligible WebSocket
server. Channel server restrictions and server variable defaults are respected.

# Code Example

The Code Example block renders a copy-pasteable request snippet for a single operation. It comes with a client picker (curl, Node, Python, and more) and, when the operation has multiple request examples, an example selector — exactly like the snippets in a full API reference.

The block mounts itself into a DOM element, so you do not need to set up Vue yourself.

## Usage

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createCodeExample } from '@scalar/blocks/code-example'
import '@scalar/blocks/style.css'

const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

const block = createCodeExample('#block', {
  store,
  path: '/users/{id}',
  method: 'get',
})

// Later, when the block is no longer needed
block.destroy()
```

`createCodeExample` accepts either a CSS selector or an `HTMLElement` as its first argument. It throws if the element cannot be found, or if the `path` and `method` do not point at an operation in the store.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `store` | `WorkspaceStore` | **Required.** The workspace store that holds the OpenAPI document(s) to render from. |
| `path` | `string` | **Required.** Path of the operation to render, e.g. `/users/{id}`. |
| `method` | `HttpMethod` | **Required.** HTTP method of the operation to render. |
| `selectedClient` | `AvailableClients[number]` | Pre-selected client ID, e.g. `shell/curl`. |
| `selectedServer` | `ServerObject \| null` | Server override used to build the example. When omitted, the server is derived from the active document (operation, then path item, then document level). Pass `null` to force "no server". |
| `selectedExample` | `string` | Pre-selected example key for parameters and the request body. |
| `securitySchemes` | `SecuritySchemeObjectSecret[]` | Security schemes applicable to the operation. |
| `darkMode` | `boolean` | Force a color mode. When omitted, the block inherits the ambient theme of the host page. |

## The store is the source of truth

The client and example selections round-trip through the store. Once a user picks a client or an example, that choice is written back to the store (`x-scalar-default-client` and `x-scalar-default-example`) and wins over the initial `selectedClient` / `selectedExample` seed.

This means selections survive re-renders and stay in sync across every block reading from the same store — pick a client in one block and the others follow.

## Cleaning up

`createCodeExample` returns the underlying Vue `app` and a `destroy` function. Call `destroy()` to unsubscribe the block from the store and unmount it.

```ts
const block = createCodeExample('#block', { store, path: '/hello', method: 'post' })

block.destroy()
```

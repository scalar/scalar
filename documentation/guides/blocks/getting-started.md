# Blocks

Blocks are small, self-contained pieces of API documentation that you can mount anywhere in your own UI. Instead of rendering a full API reference, you pick exactly the part you need — like a code example for a single operation — and drop it into your page.

Each block reads from a [workspace store](https://github.com/scalar/scalar/tree/main/packages/workspace-store) that holds your OpenAPI document(s). You create and control the store, then hand it to a block along with the operation you want to render.

## Installation

```bash
npm install @scalar/blocks
```

## Usage

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createCodeExample } from '@scalar/blocks/code-example'
import '@scalar/blocks/style.css'

// Load your OpenAPI document(s) into a store
const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

// Mount a block into a DOM element
createCodeExample('#block', {
  store,
  path: '/hello',
  method: 'post',
  selectedClient: 'node/undici',
  selectedServer: {
    url: 'https://api.example.com',
  },
})
```

## Available blocks

- [Code Example](code-example.md) — Render a copy-pasteable request snippet for a single operation, with a client picker and example selector.

More blocks are on the way.

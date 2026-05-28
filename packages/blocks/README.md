# Scalar Blocks

🚧 WIP 🚧

## Usage

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createCodeExample } from '@scalar/blocks/operation-code-sample/mount'
import '@scalar/blocks/style.css'

// Load OpenAPI documents
const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json'
})

// Mount a block
createCodeExample('#block', {
  // Data Source
  store,
  // Operation
  path: '/hello',
  method: 'post',
  // Configuration
  selectedClient: 'node/undici',
  selectedServer: {
    url: 'https://api.example.com',
  },
})
```

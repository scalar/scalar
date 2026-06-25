# Scalar Blocks

🚧 WIP 🚧

## Code Example

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createCodeExample } from '@scalar/blocks/code-example'
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

## Schema

Render an OpenAPI schema. Pass a schema object directly:

```ts
import { createSchema } from '@scalar/blocks/schema'
import '@scalar/blocks/style.css'

createSchema('#block', {
  name: 'User',
  schema: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
    },
  },
})
```

Or resolve a schema from a workspace store by JSON pointer, so `$ref`s and
discriminator mappings resolve against the active document:

```ts
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createSchema } from '@scalar/blocks/schema'
import '@scalar/blocks/style.css'

const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  url: '/openapi.json',
})

createSchema('#block', {
  store,
  pointer: '#/components/schemas/User',
})
```

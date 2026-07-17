# Scalar Blocks

🚧 WIP 🚧

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdks/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Usage

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

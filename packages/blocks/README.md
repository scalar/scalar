# Scalar Blocks

🚧 WIP 🚧

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
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

## Schema tree

Render an OpenAPI schema in a Vue application using the same tree as API Reference:

```vue
<script setup lang="ts">
import { Schema } from '@scalar/blocks/schema'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import '@scalar/blocks/style.css'

const { schema } = defineProps<{ schema: SchemaObject }>()
</script>

<template>
  <div class="scalar-app">
    <Schema :schema="schema" :eventBus="null" :options="{ hideModels: true }" />
  </div>
</template>
```

The tree supports nested properties, composition selectors, constraints, examples, and keyboard navigation. Pass schemas from the workspace store to retain resolved references. Display options are typed by `SchemaOptions`.

Translations inherit the host's `@scalar/localization` provider, including locale and custom overrides. Without a provider, labels use English.

Hosts can provide `SCHEMA_RENDERING_CONTEXT` to connect a reactive `scrollTargetId` or a `specificationExtension` component that receives the schema through its `value` prop. Call `provideSchemaExpansion(scrollTargetId)` in the same host to share expansion state and preserve deep links after navigation completes. Request-body composition selectors share their selections with code samples through `REQUEST_BODY_COMPOSITION_INDEX_SYMBOL`.

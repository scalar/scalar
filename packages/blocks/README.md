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
import { useSchemaExpansion } from '@scalar/blocks/schema/expansion'
import { ref } from 'vue'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import '@scalar/blocks/style.css'

const { schema } = defineProps<{ schema: SchemaObject }>()
const scrollTargetId = ref('')
const expansion = useSchemaExpansion(scrollTargetId)
</script>

<template>
  <div class="scalar-app">
    <Schema :schema="schema" :eventBus="null" :options="{ hideModels: true }" :scrollTargetId="scrollTargetId" :expansion="expansion" />
  </div>
</template>
```

The tree supports nested properties, composition selectors, constraints, examples, and keyboard navigation. Pass schemas from the workspace store to retain resolved references. Display options are typed by `SchemaOptions`.

Translations inherit the host's `@scalar/localization` provider, including locale and custom overrides. Without a provider, labels use English.

Hosts pass `scrollTargetId`, `specificationExtension`, and `expansion` as props. Create a shared store with `useSchemaExpansion(scrollTargetId)` from `@scalar/blocks/schema/expansion` inside the host’s setup and pass it to each tree. Without an expansion prop, a standalone tree owns its own store. The extension component receives the schema through its `value` prop. Request-body composition selectors share selections with code samples through `REQUEST_BODY_COMPOSITION_INDEX_SYMBOL`.

### Entry points

- `@scalar/blocks/schema` exposes the schema renderers, rail controls, `SchemaOptions`, translations, `SchemaRenderingProps`, and the composition-selection key.
- `@scalar/blocks/schema/expansion` exposes `useSchemaExpansion`, the expansion store and its controls, and breadcrumb node keys for hosts that render their own schema rows.
- `@scalar/blocks/schema/helpers` exposes the schema classification, composition, naming, ordering, and keyboard helpers shared with those host rows.
- `@scalar/blocks/shared` exposes the general-purpose `Badge` and `ScreenReader` components.

These entry points are supported package APIs. Implementation components such as composition selectors, enum lists, breadcrumbs, and copy-link buttons stay private to the schema renderer.

### Schema workbench and snapshots

From the repository root, build the dependencies with `pnpm turbo --filter @scalar/blocks build`, then run `pnpm --filter @scalar/blocks dev:storybook` to browse the schema stories.

The stories, interactive snapshot tests, and checked-in baselines live together in `src/schema`. Run `pnpm --filter @scalar/blocks build:storybook` followed by `pnpm --filter @scalar/blocks test:e2e:storybook` with Docker running. The browser runs in the same Linux image as CI so snapshots compare consistently across host platforms. Use `test:e2e:storybook:update-snapshots` only for intentional visual changes.

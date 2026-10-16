# Schema

The Schema block renders a schema's properties, descriptions, constraints, enums, and composition choices. Use it to document a model or a request or response shape in your own Vue 3 application.

Import `Schema` from `@scalar/blocks/schema`. There is no `createSchema` mounting helper.

## Inline schema

Install the packages used by this example:

```bash
npm install @scalar/blocks @scalar/components @scalar/workspace-store vue
```

The workspace-store coercion helper prepares an inline object for the component's schema type. It does not load or resolve external references.

```vue
<script setup lang="ts">
import { Schema } from '@scalar/blocks/schema'
import { ScalarTeleportRoot } from '@scalar/components/teleport'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import '@scalar/blocks/style.css'

const schema = coerceValue(SchemaObjectSchema, {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', description: 'Unique user identifier' },
    name: { type: 'string', examples: ['Ada'] },
    role: { type: 'string', enum: ['member', 'admin'] },
  },
})
</script>

<template>
  <div class="scalar-app light-mode">
    <ScalarTeleportRoot>
      <Schema
        name="User"
        :schema="schema"
        :eventBus="null"
        :options="{ hideModels: true }" />
    </ScalarTeleportRoot>
  </div>
</template>
```

`eventBus` and `options` are required props. Use `null` when your host does not handle navigation events. `hideModels: true` keeps model names as text when there is no models section to navigate to.

## Load a schema from an API description

For schemas containing references, load the complete API description into a workspace store first. Retrieve the schema from that store so nested references retain their resolution context. Passing `options.document` alone does not load references.

Replace the inline schema setup above with this code, keeping the same CSS import and wrappers. Serve an API description containing `components.schemas.User` at `/openapi.json`:

```ts
import { computed, onMounted, ref } from 'vue'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'

const store = createWorkspaceStore()
const error = ref('')
const document = computed(() => {
  const activeDocument = store.workspace.activeDocument
  return activeDocument && isOpenApiDocument(activeDocument)
    ? activeDocument
    : undefined
})
const schema = computed(() =>
  getResolvedRef(document.value?.components?.schemas?.User),
)

onMounted(async () => {
  try {
    await store.addDocument({ name: 'default', url: '/openapi.json' })
    if (!schema.value) {
      error.value = 'The API description has no User schema.'
    }
  } catch {
    error.value = 'The API description could not be loaded.'
  }
})
```

Inside `ScalarTeleportRoot`, render the loaded schema or its status:

```vue
<p v-if="error" role="alert">{{ error }}</p>
<Schema
  v-else-if="schema"
  name="User"
  :schema="schema"
  :eventBus="null"
  :options="{ document, hideModels: true }" />
<p v-else>Loading schema…</p>
```

## Display options

Pass these settings in the `options` prop. The package exports the `SchemaOptions` type.

| Option                         | Purpose                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hideReadOnly`                 | Hide read-only properties, for example when documenting request input.                                                                                        |
| `hideWriteOnly`                | Hide write-only properties, for example when documenting responses.                                                                                           |
| `orderSchemaPropertiesBy`      | Use `'alpha'` (the default) or `'preserve'` to retain property order.                                                                                         |
| `orderRequiredPropertiesFirst` | Place required properties before optional properties.                                                                                                         |
| `expandAllSchemaProperties`    | Initially expand nested properties while retaining their toggles.                                                                                             |
| `hideModels`                   | Render model names without links to a models section.                                                                                                         |
| `hideModelNames`               | Show structural types instead of model names.                                                                                                                 |
| `schemaKeyboardNav`            | Enable arrow-key navigation between schema row toggles.                                                                                                       |
| `showExtensions`               | Select extensions for a host-provided renderer: `true` for all, `false` for none, or an array of extension names. Requires the `specificationExtension` prop. |
| `document`                     | Supply the originating OpenAPI document for display context, including discriminator mappings.                                                                |

The component also accepts top-level props: `name`, `compact`, `hideHeading`, `hideDescription`, and `noncollapsible`. Set `noncollapsible` to keep the current schema panel open. Use `compact` for a tighter presentation.

## Expansion and host navigation

For host-level expand/collapse controls, create a store with `createSchemaExpansionStore()` from `@scalar/blocks/schema/expansion` and pass it as the `expansion` prop. Its `expandAll()` and `collapseAll()` methods control the trees sharing that store. Give each tree a distinct `breadcrumb` array so their expansion keys do not overlap.

For navigation integration, pass your workspace event bus instead of `null`. The host owns navigation and URL state. The `scrollTargetId` prop identifies the active deep-link target; `breadcrumb` supplies the schema's anchor path. These are optional integrations, not prerequisites for rendering an inline schema.

To render extensions within schema rows, pass a host adapter component through `specificationExtension`. The adapter receives `value` (the schema object) and `showExtensions`; it must select the extension fields and pass them as `extensions` to [SpecificationExtensions](specification-extensions.md). Setting `showExtensions` alone does not supply a renderer.

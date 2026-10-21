# Blocks

Blocks are individual pieces of API documentation that you can embed in your own UI. Use a request snippet, a schema, or extension values without rendering a full API reference.

## Available blocks

| Block                                                   | Import                                    | Usage                                                                                                |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Code Example](code-example.md)                         | `@scalar/blocks/code-example`             | JavaScript mounting helper or Vue component for request snippets, with client and example selection. |
| [Schema](schema.md)                                     | `@scalar/blocks/schema`                   | Vue component for schema properties, constraints, and compositions.                                  |
| [Specification Extensions](specification-extensions.md) | `@scalar/blocks/specification-extensions` | Vue component for selected extension values, including nested objects and arrays.                    |

These entry points are available in `@scalar/blocks@0.5.2`. The examples below assume a bundler such as Vite that supports package imports and CSS imports.

## Installation

For the JavaScript Code Example helper, install the block package and the workspace store used to load your API description:

```bash
npm install @scalar/blocks @scalar/workspace-store
```

For direct Vue component usage, also install Vue 3:

```bash
npm install vue
```

The Schema and Specification Extensions components receive data through props. They do not require a workspace store for inline data. Use a workspace store when loading an API description and resolving its references.

## Mount a code example

Add a target element to your page:

```html
<div id="code-example"></div>
```

Run this code in the browser after the element exists. The inline API description makes the example self-contained:

```ts
import { createCodeExample } from '@scalar/blocks/code-example'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import '@scalar/blocks/style.css'

const store = createWorkspaceStore()

await store.addDocument({
  name: 'default',
  document: {
    openapi: '3.1.0',
    info: { title: 'Hello API', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com' }],
    paths: {
      '/hello': {
        get: {
          responses: { '200': { description: 'A greeting' } },
        },
      },
    },
  },
})

const block = createCodeExample('#code-example', {
  store,
  path: '/hello',
  method: 'get',
  selectedClient: 'shell/curl',
})

// Call block.destroy() when your page or component is removed.
```

To load an existing API description instead, replace `document` with `url: '/openapi.json'`. Await `store.addDocument()` before mounting. The operation must exist in the store's active OpenAPI document.

See [Code Example](code-example.md) for options, shared selections, Vue usage, and cleanup.

## Styles and Vue components

Import `@scalar/blocks/style.css` once in your application. For direct Vue components, put the blocks inside a `scalar-app` wrapper so their scoped utility styles apply. Use `light-mode` or `dark-mode` on that wrapper to choose a color mode:

```html
<div class="scalar-app light-mode">
  <!-- Render your Vue block here. -->
</div>
```

Components with floating controls also need `ScalarTeleportRoot` from `@scalar/components/teleport` inside that wrapper. The Vue examples show this setup where needed; install `@scalar/components` when importing it directly.

`createCodeExample` supplies both wrappers itself. Its `darkMode` option forces light or dark mode; when omitted, it inherits the host page's theme. Schema and Specification Extensions currently have no equivalent JavaScript mounting helpers: use them in a Vue 3 application.

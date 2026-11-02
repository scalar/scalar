# API reference web component

Build from the repository root and start the comparison playground:

```sh
pnpm turbo --filter @scalar/api-reference... build
pnpm --filter @scalar/api-reference playground:component
```

- [Custom element](http://localhost:3173/playground/web-component/api-reference-leaky-component.html)
- [Standalone comparison](http://localhost:3173/playground/web-component/api-reference-leaky-standalone.html)

Both pages apply `button { background: red !important; }` outside the reference. The custom element keeps its buttons inside a shadow root, while the standalone reference receives the host page rule.

Load the `@scalar/api-reference/component.js` package export (or `dist/webComponent/component.js` from a CDN) to register `<scalar-api-reference>`:

```html
<scalar-api-reference></scalar-api-reference>
<script>
  document.querySelector('scalar-api-reference').configuration = {
    url: '/openapi.json',
  }
</script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference/dist/webComponent/component.js"></script>
```

Set `configuration` as a JavaScript property, including before the element is registered. Reassign the property to update the configuration. No separate stylesheet is required. Custom CSS belongs in `configuration.customCss`; use `:host` instead of `:root` to style the shadow host. CSS custom properties and inherited properties can still cross the shadow boundary.

The custom element keeps its color preference separate from the host page’s saved preference and body classes. Mount only one API reference per page; lazy-rendering and navigation state remain shared.

Search and Scalar modals stay inside the shadow root using native browser dialogs, including focus management, Escape dismissal, and scroll-lock cleanup. Search keyboard shortcuts apply only to the focused custom element. Tooltips remain in the owning shadow root, including inside native dialogs, and are removed when the embed unmounts.

This revives PR #3966. The request-client dialog also stays inside the shadow root, preserves editor state while closed, and restores focus and scroll locks on dismissal. Keyboard shortcuts stay within their owning root, and Escape dismisses only the topmost native dialog. Toasts use a local notification queue and stylesheet, including inside the request client. They support dismissal and pause their timeout while hovered or focused; unmounting clears pending timers. Navigation resolves operation and schema anchors inside the shadow root.

## Host application compatibility

The custom element addresses the Bootstrap and utility-class collisions in [#2410](https://github.com/scalar/scalar/issues/2410). Existing Vue components still share their document's CSS cascade; use the custom element when the host styles cannot be changed. In Vue, configure `compilerOptions.isCustomElement` to recognize `scalar-api-reference` and pass the configuration with `:configuration.prop="configuration"`. Import `@scalar/api-reference/component.js` on the client; do not import a separate Scalar stylesheet for the element.

Shared component styles no longer reset an unrelated host body's margin or background ([#8717](https://github.com/scalar/scalar/issues/8717)), including when the host uses CSS layers. This also applies to existing Nuxt installations. The standalone bundles retain full-page body styling for server integrations and HTML pages. Use the custom element bundle for CSS-isolated embedding.

Scalar dialogs carry their own styling class. Scalar no longer adds its reset class to the shared Headless UI portal root, which may also contain dialogs belonging to the host application.

## Vue with Bootstrap

The [Vue and Bootstrap playground](http://localhost:3173/playground/web-component/vue-bootstrap.html) loads Vue 3 and Bootstrap 5 from a CDN alongside the local component bundle. Use it to check search, the request client, and host controls together.

For a Vite Vue application, register the custom element with the template compiler:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'scalar-api-reference',
        },
      },
    }),
  ],
})
```

Then replace the ordinary Vue reference with the custom element:

```vue
<script setup>
import { onMounted } from 'vue'

const configuration = {
  url: '/openapi.json',
  darkMode: false,
}

onMounted(async () => {
  await import('@scalar/api-reference/component.js')
})
</script>

<template>
  <scalar-api-reference :configuration.prop="configuration" />
</template>
```

Keep Bootstrap's stylesheet in the host application. Remove the Scalar stylesheet import if no ordinary Scalar components need it. Move overrides intended for content inside the reference into `configuration.customCss`; selectors in the host stylesheet cannot reach that content.

# Scalar API Reference

[![Version](https://img.shields.io/npm/v/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Hits on jsdelivr](https://img.shields.io/jsdelivr/npm/hm/%40scalar%2Fapi-reference)](https://www.jsdelivr.com/package/npm/@scalar/api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Interactive API Reference from OpenAPI/Swagger Documents [Try our Demo](https://docs.scalar.com/swagger-editor)

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

### CDN

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the Scalar API Reference -->
    <script>
      Scalar.createApiReference('#app', {
        // The URL of the OpenAPI/Swagger document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

## Localization

Set `localization.locale` to render the interface in one of the built-in languages (see [Localization](https://github.com/scalar/scalar/blob/main/documentation/localization.md)). English is bundled; every other locale is downloaded on demand the first time it is used. `createApiReference` waits for that small chunk before it renders, so the interface appears in the configured language from the first paint.

If you mount the `ApiReference` component yourself, await `loadLocale` before you mount, or it renders English until the locale arrives. One call loads the locale for the API Reference, the embedded API Client and the schema blocks:

```ts
import { ApiReference, loadLocale } from '@scalar/api-reference'
import { createApp } from 'vue'

await loadLocale('de')

createApp(ApiReference, {
  configuration: { url: '/openapi.json', localization: { locale: 'de' } },
}).mount('#app')
```

`loadLocale` never rejects: when a locale fails to load, the reference keeps English and tries again on the next request.

Server rendering waits for the configured locale on its own. When you hydrate server-rendered markup yourself (instead of through `createApiReference` or the Nuxt integration, which already wait), await `loadLocale` with the same locale before calling `createSSRApp(...).mount()`.

## Hydrating server-rendered markup yourself

Non-English locales and syntax highlighting grammars load on demand. Server rendering waits for both, so the markup arrives complete. `createApiReference` and the Nuxt integration also wait for them in the browser before rendering. When you render `<ApiReference>` with your own server rendering, wait for them yourself before mounting:

```ts
import { getRenderedLanguages, loadLocale, preloadGrammars } from '@scalar/api-reference'

const root = document.getElementById('app')!

await Promise.all([
  loadLocale('de'),
  // The languages of the highlighted code in the server markup
  preloadGrammars(getRenderedLanguages(root)),
])

createSSRApp(App).mount(root)
```

Skipping a preload does not break the page, but it shows. A locale that has not loaded renders English for a moment. A grammar that has not loaded turns its highlighted code plain until the grammar arrives, and Vue logs no hydration mismatch for that.

## AsyncAPI Markdown actions

AsyncAPI channels and operations include a **Copy as Markdown** button in both layouts. Copies contain the selected section and its relevant context, using `@scalar/asyncapi-to-markdown`. Tags and introduction support custom actions but do not show a copy button by default.

When embedding Vue sections, use the `actions` slot to replace the default button, or supply an empty slot to hide it:

```vue
<AsyncApiChannel v-bind="channelProps">
  <template #actions>
    <button @click="copyPage">Copy page</button>
  </template>
</AsyncApiChannel>

<AsyncApiOperation v-bind="operationProps">
  <template #actions />
</AsyncApiOperation>
```

`AsyncApiChannel` and `AsyncApiOperation` are exported from `@scalar/api-reference/components` and receive the resolved AsyncAPI `document`. Embedded `Tag` (from `@scalar/api-reference/components`) and `InfoBlock` (from `@scalar/api-reference/blocks`) expose the same `actions` slot without a default button. Pass the resolved document as `asyncApiDocument` to `Tag` to preserve real AsyncAPI tag headings. These are section component slots, not configuration options on the full API reference.

## Documentation

[Read the documentation here](https://scalar.com/products/api-references/integrations/html-js)

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

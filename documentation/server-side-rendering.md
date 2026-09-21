# Server-Side Rendering

Pre-render the Scalar API Reference on the server for instant content, then hydrate on the client for full interactivity. Great for SEO. Works with any JavaScript/TypeScript server.

## Installation

```bash
npm install @scalar/server-side-rendering
```

## Usage

Render the HTML and JS once at startup, then serve from memory:

```ts
import { getJsAsset, renderApiReference } from '@scalar/server-side-rendering'

// Render the HTML once at startup
const html = await renderApiReference({
  pageTitle: 'My API Reference',
  config: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  },
})

// Get the JS bundle at startup
const js = getJsAsset()

// Serve the pre-rendered HTML
app.get('/scalar', (c) => c.html(html))

// Serve the JS bundle for client-side hydration
app.get('/scalar/scalar.js', (c) =>
  c.body(js, {
    headers: { 'content-type': 'application/javascript' },
  }),
)
```

`renderApiReference` returns a complete HTML document with:

- Inline CSS (no flash of unstyled content)
- A color-mode detection script (determines light/dark mode before the first paint)
- Pre-rendered HTML (immediate content, no blank page)
- A script tag to load the standalone bundle and hydrate

The standalone JS bundle from `getJsAsset()` handles client-side hydration. Serve it at the path matching the `cdn` option (defaults to `/scalar/scalar.js`).

## Options

| Option      | Type                           | Default                  | Description                                           |
| ----------- | ------------------------------ | ------------------------ | ----------------------------------------------------- |
| `config`    | `AnyApiReferenceConfiguration` | —                        | The API reference [configuration](./configuration.md) |
| `pageTitle` | `string`                       | `'Scalar API Reference'` | Page title for the HTML document                      |
| `css`       | `string`                       | Built-in styles          | Override the default CSS                              |
| `cdn`       | `string`                       | `'/scalar/scalar.js'`    | URL path where the standalone JS bundle is served     |

The `config` option accepts the same configuration as all other Scalar integrations — [read more about configuration](./configuration.md).

## Static site generation

You can also run the renderer at build time and write its output to disk. The resulting HTML and JavaScript can be deployed to a static host without a running Node.js server.

Save your OpenAPI document as `openapi.json`, then create `generate-docs.mjs`:

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { getJsAsset, renderApiReference } from '@scalar/server-side-rendering'

const content = JSON.parse(await readFile('openapi.json', 'utf8'))

const html = await renderApiReference({
  pageTitle: 'My API Reference',
  config: { content },
  cdn: './scalar.js',
})

await mkdir('dist/docs', { recursive: true })
await writeFile('dist/docs/index.html', html)
await writeFile('dist/docs/scalar.js', getJsAsset())
```

Generate and preview the site:

```bash
node generate-docs.mjs
npx serve dist
```

Open `/docs/` on the preview server and deploy the contents of `dist` to your static host. Keep the trailing slash on `/docs/` so the relative `./scalar.js` URL resolves to `/docs/scalar.js`. If your host does not redirect directory URLs, configure that redirect or use an absolute asset URL in `cdn`.

This example uses Scalar's default hash routing: operation links stay within the same HTML file, so the host does not need a fallback for nested routes. The HTML contains the rendered reference; JavaScript enables search and request testing. Re-run the script and deploy again when the API description changes. Use absolute URLs in the document's `servers` array to direct requests to your API rather than the static host.

For a Nuxt application, use the [Nuxt static site generation guide](./integrations/nuxt.md#static-site-generation) instead. Nuxt manages its own rendering, payloads, and JavaScript assets, so it does not need this package.

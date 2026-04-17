# Server-Side Rendering

Pre-render the Scalar API Reference on the server for instant content, then hydrate on the client for full interactivity. Great for SEO. Works with any JavaScript/TypeScript server.

## Installation

```bash
npm install @scalar/server-side-rendering
```

## Usage

Render the HTML and JS once at startup, then serve from memory:

```ts
import { renderApiReference, getJsAsset } from '@scalar/server-side-rendering'

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
  })
)
```

`renderApiReference` returns a complete HTML document with:

- Inline CSS (no flash of unstyled content)
- A color-mode detection script (determines light/dark mode before the first paint)
- Pre-rendered HTML (immediate content, no blank page)
- A script tag to load the standalone bundle and hydrate

The standalone JS bundle from `getJsAsset()` handles client-side hydration. Serve it at the path matching the `cdn` option (defaults to `/scalar/scalar.js`).

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | `AnyApiReferenceConfiguration` | — | The API reference [configuration](./configuration.md) |
| `pageTitle` | `string` | `'Scalar API Reference'` | Page title for the HTML document |
| `css` | `string` | Built-in styles | Override the default CSS |
| `cdn` | `string` | `'/scalar/scalar.js'` | URL path where the standalone JS bundle is served |

The `config` option accepts the same configuration as all other Scalar integrations — [read more about configuration](./configuration.md).

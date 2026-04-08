# Scalar Server-Side Rendering

[![Version](https://img.shields.io/npm/v/%40scalar/server-side-rendering)](https://www.npmjs.com/package/@scalar/server-side-rendering)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/server-side-rendering)](https://www.npmjs.com/package/@scalar/server-side-rendering)
[![License](https://img.shields.io/npm/l/%40scalar%2Fserver-side-rendering)](https://www.npmjs.com/package/@scalar/server-side-rendering)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Server-side render the Scalar API Reference with client-side hydration. Pre-renders HTML on the server for instant content, then hydrates with the standalone bundle for full interactivity.

## Installation

```bash
npm install @scalar/server-side-rendering
```

## Usage

Render the HTML and JS once at startup, then serve from memory.

```ts
import { renderApiReference, getJsAsset } from '@scalar/server-side-rendering'

// Render once at startup
const html = await renderApiReference({
  config: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  },
  pageTitle: 'My API Reference',
})

const js = getJsAsset()

// Serve the JS bundle for client-side hydration
app.get('/scalar/scalar.js', (c) => {
  return c.body(js, {
    headers: { 'content-type': 'application/javascript' },
  })
})

// Serve the pre-rendered HTML
app.get('/scalar', (c) => c.html(html))
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

# Scalar Client-Side Rendering

[![Version](https://img.shields.io/npm/v/%40scalar/client-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/client-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![License](https://img.shields.io/npm/l/%40scalar%2Fclient-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Render the Scalar API Reference as static HTML using the CDN. No server-side dependencies required.

## Installation

```bash
npm install @scalar/client-side-rendering
```

## Usage

```ts
import { renderApiReference } from '@scalar/client-side-rendering'

const html = renderApiReference({
  pageTitle: 'My API Reference',
  config: {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  },
})
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

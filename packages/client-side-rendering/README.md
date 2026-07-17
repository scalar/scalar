# Scalar Client-Side Rendering

[![Version](https://img.shields.io/npm/v/%40scalar/client-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/client-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![License](https://img.shields.io/npm/l/%40scalar%2Fclient-side-rendering)](https://www.npmjs.com/package/@scalar/client-side-rendering)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Render the Scalar API Reference as static HTML using the CDN. No server-side dependencies required.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

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

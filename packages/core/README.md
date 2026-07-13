# Scalar Core

[![Version](https://img.shields.io/npm/v/%40scalar/core)](https://www.npmjs.com/package/@scalar/core)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/core)](https://www.npmjs.com/package/@scalar/core)
[![License](https://img.shields.io/npm/l/%40scalar%2Fcore)](https://www.npmjs.com/package/@scalar/core)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Shared libraries for our packages, specifically [@scalar/api-reference](https://www.npmjs.com/pacupdatekage/@scalar/api-reference) and [@scalar/api-client](https://www.npmjs.com/package/@scalar/api-client).

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDKs](https://scalar.com/products/sdks/getting-started)** — Type-safe client libraries in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[MCP Servers](https://scalar.com/products/agent/getting-started)** — Generate secure MCP servers from your API spec.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---


## Installation

```bash
npm install @scalar/core
```

## Usage

```ts
import { getHtmlDocument } from '@scalar/core/libs/html-rendering'

const html = getHtmlDocument({
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

# Scalar Scripts

[![Version](https://img.shields.io/npm/v/%40scalar/scripts)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/scripts)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![License](https://img.shields.io/npm/l/%40scalar%2Fmock-server)](https://www.npmjs.com/package/@scalar/pre-post-request-scripts)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Post-response scripts for your OpenAPI documents.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDKs](https://scalar.com/products/sdks/getting-started)** — Type-safe client libraries in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[MCP Servers](https://scalar.com/products/agent/getting-started)** — Generate secure MCP servers from your API spec.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

Scripts are executed with the official Postman sandbox runtime (`postman-sandbox`), so the `pm` API behavior follows Postman semantics.

> Note: This is intended to be used as a plugin with @scalar/api-client.

## Installation

```bash
npm install @scalar/pre-post-request-scripts
```

## Usage

```ts
import { createApiClientWeb } from '@scalar/api-client/layouts/Web'
import { postResponseScriptsPlugin } from '@scalar/pre-post-request-scripts'
import '@scalar/api-client/style.css'

createApiClientWeb(
  document.getElementById('app'),
  {
    proxyUrl: 'https://proxy.scalar.com',
    // Load the plugin
    plugins: [
      postResponseScriptsPlugin()
    ],
  },
)
```

## Script Runtime

- Uses the official Postman sandbox package: <https://github.com/postmanlabs/postman-sandbox>
- Scripts run as Postman `test` scripts, so `pm.response`, `pm.test`, and `pm.expect` are provided by Postman
- Script results are surfaced in the Tests panel via the plugin

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

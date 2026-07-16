# Scalar Galaxy Example

[![Version](https://img.shields.io/npm/v/%40scalar/galaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/galaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![License](https://img.shields.io/npm/l/%40scalar%2Fgalaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

OpenAPI and AsyncAPI example documents in YAML and JSON to test OpenAPI and AsyncAPI tooling, run test suites or learn about OpenAPI and AsyncAPI.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdks/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Installation

```bash
npm install @scalar/galaxy
```

## Usage

### Scalar Registry

| Version | Format  | URL                                                         |
| ------- | ------- | ----------------------------------------------------------- |
| Latest  | Preview | https://registry.scalar.com/@scalar/apis/galaxy             |
| Latest  | JSON    | https://registry.scalar.com/@scalar/apis/galaxy?format=json |
| Latest  | YAML    | https://registry.scalar.com/@scalar/apis/galaxy?format=yaml |

### CDN

| Version         | Format | URL                                                                   |
| --------------- | ------ | --------------------------------------------------------------------- |
| OpenAPI Latest  | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json          |
| OpenAPI Latest  | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml          |
| OpenAPI 3.1     | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/3.1.json             |
| OpenAPI 3.1     | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/3.1.yaml             |
| AsyncAPI Latest | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/asyncapi/latest.json |
| AsyncAPI Latest | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/asyncapi/latest.yaml |
| AsyncAPI 3.0    | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/asyncapi/3.0.json    |
| AsyncAPI 3.0    | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/asyncapi/3.0.yaml    |

### Import as object

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.json'
```

### Import as JSON string

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.json?raw'
```

### Import as YAML string

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.yaml?raw'
```

### Import specific OpenAPI version

```ts
import ScalarGalaxy from '@scalar/galaxy/3.1.json'
```

### Serve the OpenAPI document using the CLI

```bash
npx @scalar/cli document serve ./src/documents/3.1.yaml --watch
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

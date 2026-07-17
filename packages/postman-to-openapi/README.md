# Postman to OpenAPI Converter

[![Version](https://img.shields.io/npm/v/%40scalar/postman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/postman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![License](https://img.shields.io/npm/l/%40scalar%2Fpostman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Convert Postman collections to [the open standard OpenAPI](https://github.com/OAI/OpenAPI-Specification). Free the postman!

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
npm install @scalar/postman-to-openapi
```

## Usage

```ts
import { convert } from '@scalar/postman-to-openapi'

// Free the postman!
const result = await convert(myPostmanCollection)

console.log(result)
```

### Detect Postman collections

Use `isPostmanCollection` to decide whether an input string should be parsed as a Postman collection before converting.

```ts
import { convert, isPostmanCollection } from '@scalar/postman-to-openapi'

if (isPostmanCollection(input)) {
  const openApiDocument = convert(input)
  console.log(openApiDocument)
}
```

`isPostmanCollection` accepts exported collections that do not include `info._postman_id` as long as they contain a valid Postman schema URL and an `item` tree.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## Thank you!

This package is based on the existing [`postman-to-openapi`](https://github.com/joolfe/postman-to-openapi) by [@joolfe](https://github.com/joolfe). We update the code and adapted it to our use case. You might consider our package the modern successor.

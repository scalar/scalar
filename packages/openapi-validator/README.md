# Scalar OpenAPI Validator

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-validator)](https://www.npmjs.com/package/@scalar/openapi-validator)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-validator)](https://www.npmjs.com/package/@scalar/openapi-validator)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-validator)](https://www.npmjs.com/package/@scalar/openapi-validator)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Validate OpenAPI documents against the OpenAPI Specification. Supports OpenAPI 3.2, 3.1, 3.0 and Swagger 2.0.

This package does the schema validation part of [`@scalar/openapi-parser`](https://www.npmjs.com/package/@scalar/openapi-parser) on its own. Use it when all you need is validation and you do not want the rest of the parser.

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
npm add @scalar/openapi-validator
```

## Usage

Pass a JSON string, a YAML string, or an object:

```ts
import { validate } from '@scalar/openapi-validator'

const result = validate({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(result.valid)

if (!result.valid) {
  console.log(result.errors)
}
```

### References

This validator does not resolve references. It validates a single, self-contained document. If your document references other files or URLs, bundle or dereference it first (for example with [`@scalar/json-magic`](https://www.npmjs.com/package/@scalar/json-magic) or [`@scalar/openapi-parser`](https://www.npmjs.com/package/@scalar/openapi-parser)) and then validate the result.

### Throw on error

```ts
import { validate } from '@scalar/openapi-validator'

try {
  validate(document, { throwOnError: true })
} catch (error) {
  // Handle the first validation error
}
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

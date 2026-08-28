# Scalar AsyncAPI Validator

[![Version](https://img.shields.io/npm/v/%40scalar/asyncapi-validator)](https://www.npmjs.com/package/@scalar/asyncapi-validator)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/asyncapi-validator)](https://www.npmjs.com/package/@scalar/asyncapi-validator)
[![License](https://img.shields.io/npm/l/%40scalar%2Fasyncapi-validator)](https://www.npmjs.com/package/@scalar/asyncapi-validator)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Validate AsyncAPI documents against the AsyncAPI Specification. Supports AsyncAPI 2.x and 3.x.

Built on [`@scalar/json-schema-validator`](https://www.npmjs.com/package/@scalar/json-schema-validator), using the official schemas from [`@asyncapi/specs`](https://www.npmjs.com/package/@asyncapi/specs).

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
npm add @scalar/asyncapi-validator
```

## Usage

Pass a JSON string, a YAML string, or an object:

```ts
import { validate } from '@scalar/asyncapi-validator'

const result = validate({
  asyncapi: '3.0.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
})

console.log(result.valid)

if (!result.valid) {
  console.log(result.errors)
}
```

The AsyncAPI version is read from the document's `asyncapi` field, and the matching schema is chosen automatically.

### Schema-level validation

This is schema-level validation. As the AsyncAPI project notes, JSON Schema alone cannot express every rule of the specification, so a valid result here does not guarantee a semantically complete document.

### Throw on error

```ts
import { validate } from '@scalar/asyncapi-validator'

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

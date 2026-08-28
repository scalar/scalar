# Scalar JSON Schema Validator

[![Version](https://img.shields.io/npm/v/%40scalar/json-schema-validator)](https://www.npmjs.com/package/@scalar/json-schema-validator)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/json-schema-validator)](https://www.npmjs.com/package/@scalar/json-schema-validator)
[![License](https://img.shields.io/npm/l/%40scalar%2Fjson-schema-validator)](https://www.npmjs.com/package/@scalar/json-schema-validator)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Validate documents against a JSON Schema with [Ajv](https://ajv.js.org/) and get short, human-friendly error messages.

This is the shared validation engine behind [`@scalar/openapi-validator`](https://www.npmjs.com/package/@scalar/openapi-validator). It knows nothing about OpenAPI or AsyncAPI, so you can use it with any JSON Schema.

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
npm add @scalar/json-schema-validator
```

## Usage

Pass a document (an object, or a JSON/YAML string) and a JSON Schema:

```ts
import { validate } from '@scalar/json-schema-validator'

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name'],
  properties: { name: { type: 'string' } },
}

const result = validate({ name: 'Hello' }, schema)

console.log(result.valid)

if (!result.valid) {
  console.log(result.errors)
}
```

The dialect is picked automatically from the schema's `$schema` (JSON Schema draft-04, draft-07, and 2020-12 are supported).

### Reuse a schema

When validating many documents against the same schema, compile it once:

```ts
import { createValidator } from '@scalar/json-schema-validator'

const validateUser = createValidator(schema)

validateUser({ name: 'Ada' })
validateUser({ name: 'Grace' })
```

### Extra formats

Register custom Ajv formats via `formats`:

```ts
validate(document, schema, {
  formats: {
    'media-range': true,
  },
})
```

Formats are applied when a schema is compiled, and `validate` caches the compiled
schema by identity. So `formats` only takes effect the first time it sees a given
schema object — later calls reuse the validator built from that first set. When
different documents need different formats for the same schema, build a validator
per format set with `createValidator` instead.

### Throw on error

```ts
try {
  validate(document, schema, { throwOnError: true })
} catch (error) {
  // Handle the first validation error
}
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

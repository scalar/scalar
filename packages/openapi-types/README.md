# Scalar OpenAPI Types

[![Version](https://img.shields.io/npm/v/@scalar/openapi-types)](https://www.npmjs.com/package/@scalar/openapi-types)
[![Downloads](https://img.shields.io/npm/dm/@scalar/openapi-types)](https://www.npmjs.com/package/@scalar/openapi-types)
[![License](https://img.shields.io/npm/l/@scalar/openapi-types)](https://www.npmjs.com/package/@scalar/openapi-types)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Strict, well-documented OpenAPI TypeScript types based on official JSON Schemas, with specification links in comments.

## Installation

```bash
npm add @scalar/openapi-types
```

## Versions

* OpenAPI 3.2
* OpenAPI 3.1
* OpenAPI 3.0
* Swagger 2.0

## Usage

```ts
import type { Document } from '@scalar/openapi-types/3.2'

const file: Document = {
  openapi: '3.2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

### Individual Exports

If your bundler doesn't work with barrel files, you can explicitly import objects, too:

```ts
import type { Document } from '@scalar/openapi-types/3.2/document'

const file: Document = {
  openapi: '3.2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

## Helpers

`@scalar/openapi-types/helpers` ships a small set of runtime helpers for working
with the type definitions above. They are written to work with `SchemaObject`
across all supported OpenAPI versions (2.0, 3.0, 3.1, and 3.2).

### `isDereferenced(value)`

Type guard that returns `true` when `value` is not a `ReferenceObject` (i.e. it
does not have a string `$ref` property). Useful when walking a document that may
mix references and inline objects. Like the schema discriminators, it narrows
the reference members out of a `SchemaObject | ReferenceObject` union from any
supported OpenAPI version.

```ts
import { isDereferenced } from '@scalar/openapi-types/helpers'

const schema = components.schemas?.Pet

if (isDereferenced(schema)) {
  // `schema` is narrowed to the inline SchemaObject and `$ref` is ruled out
  schema.type
}
```

### Schema discriminators

Schema discriminators narrow a `SchemaObject` union to the variant whose `type`
matches the guard, so type-specific properties (such as `properties`, `items`,
or `minLength`) become accessible without a manual cast.

| Helper                | Matches when…                                          |
| --------------------- | ------------------------------------------------------ |
| `isObjectSchema`      | `type === 'object'`                                    |
| `isArraySchema`       | `type === 'array'`                                     |
| `isStringSchema`      | `type === 'string'`                                    |
| `isNumberSchema`      | `type === 'number'`                                    |
| `isIntegerSchema`     | `type === 'integer'`                                   |
| `isNumericSchema`     | `type === 'number'` or `type === 'integer'`            |
| `isBooleanSchema`     | `type === 'boolean'`                                   |
| `isNullSchema`        | `type === 'null'` (OpenAPI 3.1+)                       |
| `isMultiTypeSchema`   | `type` is an array of primitive types (OpenAPI 3.1+)   |
| `isUntypedSchema`     | `type` is not set                                      |
| `isBooleanJsonSchema` | the schema itself is the literal `true` or `false`     |

```ts
import { isArraySchema, isObjectSchema } from '@scalar/openapi-types/helpers'
import type { SchemaObject } from '@scalar/openapi-types/3.1'

function describe(schema: SchemaObject) {
  if (isObjectSchema(schema)) {
    return Object.keys(schema.properties ?? {})
  }

  if (isArraySchema(schema)) {
    return schema.items
  }

  return null
}
```

> `isBooleanSchema` matches an OpenAPI schema with `type: 'boolean'`.
> `isBooleanJsonSchema` matches the JSON Schema shorthand where the schema
> itself is `true` (allow any value) or `false` (allow no value). Use the one
> that fits your check.

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

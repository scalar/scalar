# Scalar OpenAPI Types

[![CI](https://github.com/scalar/scalar/actions/workflows/ci.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/ci.yml)
[![Contributors](https://img.shields.io/github/contributors/scalar/scalar)](https://github.com/scalar/scalar/graphs/contributors)
[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Modern OpenAPI parser written in TypeScript, with support for Swagger 2.0, OpenAPI 3.0, 3.1 and 3.2

## Installation

```bash
npm add @scalar/openapi-types
```

## Usage

```ts
import type { OpenAPI } from '@scalar/openapi-types'

const file: OpenAPI.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

### Zod Schemas

Experimental: This package exposes OpenAPI-compliant Zod schemas for all OpenAPI object types. You can use them to parse user input safely with Zod.

```ts
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/unprocessed'

OpenApiObjectSchema.parse({
  // This will be omitted:
  invalidAttribute: 123,
  // Those will pass:
  openapi: '3.1.1',
  info: {
    title: 'Example API',
    version: '1.0'
  },
  paths: {
    '/example': {
      get: {
        description: 'My example operation',
      }
    }
  },
})
```

What's “unprocessed”? It's for the content of a “raw” OpenAPI document, that might still contain `$ref`s (references).

We also provide Zod schemas for processed OpenAPI documents, where the `$ref`s are resolved already:

```ts
// Import the Zod Schema without the $ref property:
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/processed'

OpenApiObjectSchema.parse({
  // …
})
```

#### Extend the Zod schemas

While you can absolutely use the Zod schemas directly, you can also extend and compose them.

Here is a basic example to add an extension on the top level:

```ts
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { XScalarIconSchema } from '@scalar/openapi-types/schemas/extensions'

const MyCustomSchema = OpenApiObjectSchema
  // Add the `x-scalar-icon` OpenAPI extension
  .merge(
    XScalarIconSchema
  )
  // Add a custom property
  .extend({
    'x-customProperty': z.boolean().optional(),
  })
```

This will get a little bit more complex when you want to add a property to something that's deeply nested:

```ts
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { XScalarIconSchema } from '@scalar/openapi-types/schemas/extensions'

const MyCustomSchema = OpenApiObjectSchema
  .extend({
    // Overwrite the Schema
    'info': InfoObjectSchema.extend({
      // Add a custom property
      'x-customProperty': z.boolean().optional(),
    }),
  })
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

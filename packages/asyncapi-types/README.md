# Scalar AsyncAPI Types

[![Version](https://img.shields.io/npm/v/@scalar/asyncapi-types)](https://www.npmjs.com/package/@scalar/asyncapi-types)
[![Downloads](https://img.shields.io/npm/dm/@scalar/asyncapi-types)](https://www.npmjs.com/package/@scalar/asyncapi-types)
[![License](https://img.shields.io/npm/l/@scalar/asyncapi-types)](https://www.npmjs.com/package/@scalar/asyncapi-types)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

AsyncAPI TypeScript types and TypeBox schemas

## Usage

### Compile-time Validation (using TypeScript types)

Use the `AsyncApiDocument` type to ensure your documents match the spec at compile time:

```ts
import type { AsyncApiDocument } from '@scalar/asyncapi-types/types/v3.0'

const MY_DOCUMENT = {
  asyncapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
} satisfies AsyncApiDocument
```

### Runtime Validation (using TypeBox schema)

> Note: We maintain our own fork of the official typebox package with support for circular references.

Validate AsyncAPI documents at runtime with the TypeBox schema:

```ts
import { Value } from '@scalar/typebox/value'
import { AsyncApiDocumentSchema } from '@scalar/asyncapi-types/schemas/v3.0'

const MY_DOCUMENT = {
  asyncapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
}

const isValid = Value.Check(AsyncApiDocumentSchema, MY_DOCUMENT)
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

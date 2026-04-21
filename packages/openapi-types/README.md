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

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

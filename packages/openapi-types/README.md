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

## New Usage

We now have stricter openapi types, generated from the OpenAPI Spec including links back to the documentation, they
are exported from the versions as seen here:

```ts
import type { Document } from '@scalar/openapi-types/3.2.0'

const file: Document = {
  openapi: '3.2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

### Namespace import

We have kept the namespace-like exports as well, they can be imported like so:

```ts
import type { OpenAPIV3_2 } from '@scalar/openapi-types'

const file: OpenAPIV3_2.Document = {
  openapi: '3.2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

### Individual exports

We also have exports from the individual files if your bundler doesn't work with barrel files.

```ts
import type { Document } from '@scalar/openapi-types/3.2.0/document'

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

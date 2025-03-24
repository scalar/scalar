# Scalar OpenAPI Types

[![CI](https://github.com/scalar/scalar/actions/workflows/ci.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/ci.yml)
[![Contributors](https://img.shields.io/github/contributors/scalar/scalar)](https://github.com/scalar/scalar/graphs/contributors)
[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Modern OpenAPI parser written in TypeScript, with support for Swagger 2.0, OpenAPI 3.0 and OpenAPI 3.1

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
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1'

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

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

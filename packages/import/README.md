# Scalar Import

[![Version](https://img.shields.io/npm/v/%40scalar/import)](https://www.npmjs.com/package/@scalar/import)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/import)](https://www.npmjs.com/package/@scalar/import)
[![License](https://img.shields.io/npm/l/%40scalar%2Fimport)](https://www.npmjs.com/package/@scalar/import)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Pass an URL to an OpenAPI document, a Swagger document, a Postman collection, a Scalar API reference, a Scalar Sandbox link … or basically anything and retrieve an OpenAPI document.

## Installation

```bash
npm install @scalar/import
```

## Usage

### Find any OpenAPI/Swagger document URL

```ts
import { resolve } from '@scalar/import'

// Get the Swagger 2.0 URL (https://petstore.swagger.io/v2/swagger.json)
const result = await resolve('https://petstore.swagger.io/')
```

### Make everything an OpenAPI document

```ts
import { normalize } from '@scalar/import'

// Get an OpenAPI 3.1 document, though the given URL just has a Swagger 2.0 document
const result = await normalize('https://petstore.swagger.io/')
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/openapi-parser/blob/main/LICENSE).

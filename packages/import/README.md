# Scalar Import

[![Version](https://img.shields.io/npm/v/%40scalar/import)](https://www.npmjs.com/package/@scalar/import)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/import)](https://www.npmjs.com/package/@scalar/import)
[![License](https://img.shields.io/npm/l/%40scalar%2Fimport)](https://www.npmjs.com/package/@scalar/import)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Pass an URL to an OpenAPI document, a Swagger document, a Postman collection, a Scalar API reference, a Scalar Sandbox link … basically anything, and retrieve an OpenAPI document.

## Installation

```bash
npm install @scalar/import
```

## Usage

### Find any OpenAPI/Swagger document URL

```ts
import { resolve } from '@scalar/import'

// Get the Swagger 2.0 URL from Swagger UI
const result = await resolve('https://petstore.swagger.io/')

// https://petstore.swagger.io/v2/swagger.json
```

## Features

- Resolves URLs to OpenAPI specifications from various sources
- Supports JSON and YAML formats (`.json`, `.yaml`, `.yml`)
- Extracts OpenAPI specification URLs from HTML content, including:
  - Scalar API Reference `<script>` tags
  - Redoc HTML and JavaScript implementations
- Works with different quote styles and data attribute formats
- Robust error handling for various HTML structures
- Handles Scalar Sandbox URLs

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/openapi-parser/blob/main/LICENSE).

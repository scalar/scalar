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

Find any OpenAPI/Swagger document URL in any content:

```ts
import { resolve } from '@scalar/import'

// Get the raw file URL from a GitHub link
const result = await resolve(
  'https://github.com/outline/openapi/blob/main/spec3.yml',
)

// https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml
```

## Features

- Resolves URLs to OpenAPI specifications from various sources
- Supports JSON and YAML formats (`.json`, `.yaml`, `.yml`)
- Extracts OpenAPI specification URLs from HTML content, including:
  - Scalar API Reference `<script>` tags
  - Redoc HTML and JavaScript implementations
- Works with different quote styles and data attribute formats
- Robust error handling for various HTML structures
- Transforms GitHub URLs to raw file URLs
- Handles Scalar Sandbox URLs

### Examples

| Input                                                                  | Output                                                                    | Description                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json           | Same as input                                                             | Returns JSON URLs as-is                                              |
| https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml or \*.yml | Same as input                                                             | Returns YAML URLs as-is                                              |
| https://sandbox.scalar.com/p/dlw8v                                     | https://sandbox.scalar.com/files/dlw8v/openapi.yaml                       | Resolves sandbox URLs to specific file paths                         |
| https://github.com/owner/repo/blob/main/openapi.yaml                   | https://raw.githubusercontent.com/owner/repo/refs/heads/main/openapi.yaml | Transforms GitHub URLs to raw file URLs                              |
| HTML with data-url attribute                                           | URL from data-url attribute                                               | Extracts URL from HTML script tag with data-url attribute            |
| HTML with relative URL `/openapi.yaml`                                 | https://example.com/openapi.yaml                                          | Resolves relative URLs to absolute URLs                              |
| HTML with JSON configuration                                           | URL from JSON configuration                                               | Extracts URL from JSON configuration in data-configuration attribute |
| Redoc HTML                                                             | URL from spec-url attribute                                               | Extracts URL from Redoc's spec-url attribute                         |
| HTML with embedded OpenAPI                                             | Parsed OpenAPI object                                                     | Extracts and parses embedded OpenAPI JSON from HTML                  |

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/openapi-parser/blob/main/LICENSE).

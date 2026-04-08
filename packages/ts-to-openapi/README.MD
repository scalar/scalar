# Scalar Typescript Type to OpenAPI Spec Converter

[![Version](https://img.shields.io/npm/v/%40scalar/type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![License](https://img.shields.io/npm/l/%40scalar%type-to-openapi)](https://www.npmjs.com/package/@scalar/type-to-openapi)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This package converts TypeScript route handlers and type annotations into an OpenAPI API description document.

The current focus is Next.js App Router route handlers, where you can generate an OpenAPI 3.1 API description document
from files in `app/api`.

## Usage (Next.js)

Create a script in your Next.js project:

```ts
import { generateNextJsOpenApiDocument } from '@scalar/ts-to-openapi'

const document = generateNextJsOpenApiDocument({
  cwd: process.cwd(),
  apiDirectory: 'app/api',
  info: {
    title: 'My API',
    version: '1.0.0',
  },
})

console.log(JSON.stringify(document, null, 2))
```

## Exported APIs

- `generateNextJsOpenApiDocument(options)` - Generate a full OpenAPI 3.1 API description document.
- `getOpenApiPathFromNextJsRouteFile(routeFileName, apiDirectory)` - Convert a Next.js route file path to an OpenAPI path.
- `getPathItemFromNextJsSourceFile(sourceFile, program)` - Build an OpenAPI path item from a route source file.
- `getSchemaFromTypeNode(typeNode, program, fileNameResolver)` - Convert TypeScript type nodes to OpenAPI schemas.
- `generateResponses(node, typeChecker)` - Derive OpenAPI responses from route handler returns.

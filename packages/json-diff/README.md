# Scalar JSON Diff

[![Version](https://img.shields.io/npm/v/%40scalar/json-diff)](https://www.npmjs.com/package/@scalar/json-diff)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/json-diff)](https://www.npmjs.com/package/@scalar/json-diff)
[![License](https://img.shields.io/npm/l/%40scalar%2Fjson-diff)](https://www.npmjs.com/package/@scalar/json-diff)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This package provides a way to compare two OpenAPI definitions and get the differences, resolve conflicts and return conflicts that need to be resolved manually.

# Quickstart

```ts
import { apply, diff, merge } from '@scalar/json-diff'

const baseDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.0',
  },
}

const documentV1 = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.0',
  },
  change: 'This is a new property',
}

const documentV2 = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.1',
  },
}

// Merge the changes of both versions with the same parent document
const { diffs, conflicts } = merge(
  diff(baseDocument, documentV1),
  diff(baseDocument, documentV2),
)

// Apply changes from v1 and v2 to the parent document to get the final document
const finalDocument = apply(baseDocument, diffs)
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

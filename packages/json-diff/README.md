# @scalar/json-diff

This package provides a way to compare two openapi objects and get the differences, resolve conflicts and return conflicts that need to be resolved manually

# Quick start

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

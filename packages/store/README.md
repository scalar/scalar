# Scalar Collection

[![Version](https://img.shields.io/npm/v/%40scalar/store)](https://www.npmjs.com/package/@scalar/store)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/store)](https://www.npmjs.com/package/@scalar/store)
[![License](https://img.shields.io/npm/l/%40scalar%2Fstore)](https://www.npmjs.com/package/@scalar/store)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A powerful data store for OpenAPI documents that handles `$ref` pointers with Vue reactivity support.

## Features

- Behaves like a regular object
- Resolves internal $ref's magically
- Fetches external references asynchronously
- Updates asynchrously using Vue's reactivity model
- Batches HTTP requests to avoid server limits
- Preserves the original document structure, exports with all $ref's intact

## Installation

```bash
npm install @scalar/store
```

## Basic Usage

Create a new collection instance:

```ts
import { createCollection } from '@scalar/store'

// Create a collection from an OpenAPI document containing $ref's
const collection = await createCollection({
  content: {
    openapi: '3.1.1',
    info: {
      title: 'Hello World',
      version: '1.0.0',
    },
    components: {
      schemas: {
        Person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        User: {
          $ref: '#/components/schemas/Person',
        },
      },
    },
  }
})

// Access the data without caring about $ref's
console.log(collection.document.components.schemas.User)

// Output: { type: 'object', properties: { name: { type: 'string' } } }
```

### Reference Resolution

The store automatically resolves JSON References (`$ref`) when accessing properties:

```ts
const collection = await createCollection({
  content: {
    components: {
      schemas: {
        Person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        User: {
          $ref: '#/components/schemas/Person',
        },
      },
    },
  }
})

// Both paths access the same data
const person = collection.document.components.schemas.Person
const user = collection.document.components.schemas.User

// Changes through either path update the source
user.properties.age = { type: 'number' }
console.log(person.properties.age) // { type: 'number' }
```

### Export

Export the raw document with references intact:

```ts
const collection = await createCollection({
  content: {
    components: {
      schemas: {
        Person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        User: {
          $ref: '#/components/schemas/Person',
        },
      },
    },
  }
})

// Get the raw document with $refs preserved
const raw = collection.export()
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

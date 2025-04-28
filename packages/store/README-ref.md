# Scalar Store

A powerful data store for OpenAPI documents that handles `$ref` pointers with Vue reactivity support.

## Features

- Seamless reference resolution
- Vue reactivity support
- Circular reference handling
- Original document structure preservation
- Caching for resolved references

## Installation

```bash
npm install @scalar/store
```

## Basic Usage

Create a new store instance:

```ts
import { createStore } from '@scalar/store/refs'

// Create a store with a document containing refs
const store = createStore({
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
})

// Access the data without caring about $ref's
console.log(store.document.components.schemas.User)

// Output: { type: 'object', properties: { name: { type: 'string' } } }
```

## Reference Resolution

The store automatically resolves JSON References (`$ref`) when accessing properties:

```ts
const store = createStore({
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
})

// Both paths access the same data
const person = store.document.components.schemas.Person
const user = store.document.components.schemas.User

// Changes through either path update the source
user.properties.age = { type: 'number' }
console.log(person.properties.age) // { type: 'number' }
```

## Reactive Updates

The store maintains Vue reactivity while resolving references:

```ts
import { watch } from 'vue'
import { createStore } from '@scalar/store/refs'

const store = createStore({
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
})

// Vue reactivity works through references
watch(
  () => store.document.components.schemas.User.properties,
  (newProps) => {
    console.log('User properties changed:', newProps)
  }
)
```

## Private properties

The store supports temporary data using properties prefixed with `_`. These properties are removed when exporting:

```ts
const store = createStore({
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
})

// Prefix temporary properties with _ and they won’t be exported.
store.document.components.schemas.Person._selected = true
```


## Exporting

Export the raw document with references intact:

```ts
const store = createStore({
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
})

// Get the raw document with $refs preserved
const raw = store.export()
```


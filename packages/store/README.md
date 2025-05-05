# Scalar Collection

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

Create a new collection instance:

```ts
import { createCollection } from '@scalar/store'

// Create a collection from an OpenAPI document containing $ref's
const collection = createCollection({
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
console.log(collection.document.components.schemas.User)

// Output: { type: 'object', properties: { name: { type: 'string' } } }
```

### Reference Resolution

The store automatically resolves JSON References (`$ref`) when accessing properties:

```ts
const collection = createCollection({
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
const person = collection.document.components.schemas.Person
const user = collection.document.components.schemas.User

// Changes through either path update the source
user.properties.age = { type: 'number' }
console.log(person.properties.age) // { type: 'number' }
```

### Reactive Updates

The collection maintains Vue reactivity while resolving references:

```ts
import { watch } from 'vue'
import { createCollection } from '@scalar/store'

const collection = createCollection({
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
  () => collection.document.components.schemas.User.properties,
  (newProps) => {
    console.log('User properties changed:', newProps)
  }
)
```

### Private properties

Collections support temporary data using properties prefixed with `_`. These properties are removed when exporting:

```ts
const collection = createCollection({
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
collection.document.components.schemas.Person._selected = true
```

### Exporting

Export the raw document with references intact:

```ts
const collection = createCollection({
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
const raw = collection.export()
```

## Merge Unrelated Documents

```ts
const collection = createCollection({
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0'
  },
  paths: {
    '/planets': {
      get: { summary: 'List planets' },
    },
  }
})

// Add something to the existing document
collection.merge({
  info: {
    // The result will have the new title and the version from the original document
    title: 'New Title'
  },
  paths: {
    // The result will have both paths
    '/foobar': {
      get: { summary: 'Foobar' },
    },
  },
})
```

## Overlays

```ts
const collection = createCollection({
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0'
  },
  paths: {
    '/planets': {
      get: { summary: 'List planets' },
    },
  },
})

// Add an overlay
collection.addOverlay({
  overlay: '1.0.0',
  info: {
    title: 'Overlay Example',
    version: '1.0.0'
  },
  actions: [
    {
      target: '$.info',
      update: { title: 'Overlayed Title' },
    },
    {
      target: "$.paths['/planets'].get",
      update: { summary: 'Overlayed summary' },
    },
  ]
})

// Or even multiple at once
collection.addOverlay([overlay1, overlay2])
```


## Workspaces

Create a new worksapce instance and manage collections:

```ts
import { createWorkspace } from '@scalar/store'

// Create a new workspace
const workspace = createWorkspace()

// Load data into a collection
workspace.load('myCollection', {
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0',
  },
  paths: {},
})

// Export data from a collection
const data = workspace.export('myCollection')
```

### Async Data Loading

The workspace supports async data loading for remote data fetching:

```ts
const workspace = createWorkspace()

// Load data asynchronously
await workspace.load('myCollection', async () => {
  const response = await fetch('https://example.com/openapi.json')

  return response.json()
})
```

### Local Storage Persistence

Enable automatic state persistence to localStorage:

```ts
import { createWorkspace, localStoragePlugin } from '@scalar/store'

// Create a workspace with localStorage persistence
const workspace = createWorkspace({
  plugins: [
    localStoragePlugin(),

    // Or specify a custom storage key (default: 'state')
    localStoragePlugin({ key: 'my-state' })
  ]
})
```


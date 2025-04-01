# Scalar Store

A state management solution for OpenAPI documents with built-in persistence support.

## Installation

```bash
npm install @scalar/store
```

## Basic Usage

Create a new store instance and manage collections:

```ts
import { createStore } from '@scalar/store'

// Create a new store
const store = createStore()

// Load data into a collection
store.actions.load('myCollection', {
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0',
  },
  paths: {},
})

// Export data from a collection
const data = store.actions.export('myCollection')
```

## Async Data Loading

The store supports async data loading for remote data fetching:

```ts
const store = createStore()

// Load data asynchronously
await store.actions.load('api', async () => {
  const response = await fetch('https://example.com/openapi.json')

  return response.json()
})
```

## Local Storage Persistence

Enable automatic state persistence to localStorage:

```ts
import { createStore, localStoragePlugin } from '@scalar/store'

// Create a store with localStorage persistence
const store = createStore({
  plugins: [
    localStoragePlugin(),

    // Or specify a custom storage key (default: 'state')
    localStoragePlugin({ key: 'my-state' })
  ]
})
```

## Tasks/Ideas

- [ ] When a collection is imported asynchronously, we should already add a collection with a loading state or something, so we can render it already.
- [ ] We need to add tests for a few real-world examples.
- [ ] We need to use the new Zod schemas to validate the input.
- [ ] We need to deal with $ref’s somehow (needs some tinkering with various approaches).
- [ ] Prefix custom attributes with underscore _foobar (or extension)
- [ ] While we’re at it, should we add super basic support for other formats like AsyncAPI? (no validation or such, just keeping in mind for the structure of the store)

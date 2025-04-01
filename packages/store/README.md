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

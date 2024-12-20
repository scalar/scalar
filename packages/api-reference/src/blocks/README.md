# Scalar Blocks

TODO: Write documentation

## Installation

```bash
npm install @scalar/api-reference
```

## Usage

```ts
import {
  createCodeExamplesBlock,
  createOperationBlock,
  createStore,
} from '@scalar/api-reference/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

createOperationBlock({
  store,
  location: getLocation(['paths', 'planets/{planetId}', 'get']),
  element: '[data-scalar-block="operation"]',
})
```

## createStore

```ts
import { createStore } from '@scalar/api-reference/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})
```

```ts
import { createStore } from '@scalar/api-reference/blocks'

const { store } = createStore({
  content: JSON.stringify({
    openapi: '3.1.1',
    info: {
      title: 'Hello World',
      version: '1.0.0',
    },
    paths: {
      '/foobar': {
        get: {
          summary: 'Hello World',
        },
      },
    },
  }),
})
```

```ts
import { createStore } from '@scalar/api-reference/blocks'

const { store, addCollection } = createStore()

addCollection({
  // use a name to reference the collection later
  name: 'scalar-galaxy',
  // pass a URL:
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  // or pass content as a string:
  // content: JSON.stringify({
  //   openapi: '3.1.1',
  //   ...
  // }),
})
```

```ts
import { createStore } from '@scalar/api-reference/blocks'

const { store } = createStore({
  theme: 'purple',
})
```

## createOperationBlock

```ts
import { createOperationBlock, createStore } from '@scalar/api-reference/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

const { operationBlock } = createOperationBlock({
  // If passed, the block will mount to the element during initialization:
  element: '#scalar-operation-block',
  store,
  // location: '#/paths/~1planets~1{planetId}/get',
  location: getLocation(['paths', '/planets/{planetId}', 'get']),
})
```

```ts
import { createOperationBlock, createStore } from '@scalar/api-reference/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

const { mount } = createOperationBlock({
  store,
  location: getLocation(['paths', '/planets/{planetId}', 'get']),
})

// Mount it after initialization with just a selector string …
mount('#scalar-operation-block')
// or a DOM element:
// mount(document.getElementById('scalar-api-reference'))
```

## createCodeExamplesBlock

```ts
import {
  createCodeExamplesBlock,
  createStore,
} from '@scalar/api-reference/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

const { codeExamplesBlock } = createCodeExamplesBlock({
  element: '#scalar-code-examples-block',
  store,
  location: getLocation(['paths', '/planets/{planetId}', 'get']),
})
```

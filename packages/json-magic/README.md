# json-magic

A collection of utilities for working with JSON objects, including diffing, conflict resolution, bundling and more.

## bundle

Bundle external references in a json object

### Quick start

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle({
 $ref: 'http://example.com/document.json' 
}, {
  plugins: [fetchUrls()],
  treeShake: false,
})

// get the bundled json object
console.log(result)
```

#### Plugins

If you are on a browser environment import plugins from `@scalar/json-magic/bundle/plugins/browser` while if you are on a node environment you can import from `@scalar/json-magic/bundle/plugins/node`

##### fetchUrls
This plugins handles all external urls. It works for both node.js and browser environment

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: 'https://example.com/user-schema.json#' }
    }
  }
}

// This will bundle all external documents and turn all references from external into internal
await bundle(document, {
  plugins: [fetchUrls()],
  treeShake: true  // <------  This flag will try to remove any unused part of the external document
})

console.log(document)
```

###### Limiting the number of concurrent requests

```ts
await bundle(document, {
  plugins: [
    fetchUrls({
      limit: 10, // it should run at most 10 requests at the same time
    }),
  ],
  treeShake: false
})

```

###### Custom headers
To pass custom headers to requests for specific domains you can configure the fetch plugin like the example

```ts
await bundle(
  document,
  {
    plugins: [
      fetchUrls({
        // Pass custom headers
        // The header will only be attached to the list of domains
        headers: [
          {
            domains: ['example.com'],
            headers: {
              'Authorization': 'Bearer <TOKEN>'
            }
          }
        ]
      }),
      readFiles(),
    ],
    treeShake: false
  },
)
```

###### Custom fetch function
For advanced use cases like proxying requests or implementing custom network logic, you can provide your own fetch implementation. This allows you to handle things like CORS restrictions, custom authentication flows, or request/response transformations.

```ts
await bundle(
  document,
  {
    plugins: [
      fetchUrls({
        // Custom fetcher function
        fetch: async (input, init) => {
          console.log('Custom fetch logic')
          return fetch(input, init)
        },
      })
      readFiles(),
    ],
    treeShake: false
  },
)
```

###### Bundle from remote url

```ts
const result = await bundle(
  'https://example.com/openapi.json',
  {
    plugins: [
      fetchUrls(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### readFiles
This plugins handles local files. Only works on node.js environment

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: './user-schema.json#' }
    }
  }
}

// This will bundle all external documents and turn all references from external into internal
await bundle(document, {
  plugins: [readFiles()],
  treeShake: false
})

console.log(document)
```

###### Bundle from local file
You can pass the file path directly but make sure to have the correct plugins to handle reading from the local files

```ts
const result = await bundle(
  './input.json',
  {
    plugins: [
      readFiles(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### parseJson

You can pass raw json string as input
```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseJson } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle(
  '{ "openapi": "3.1.1" }',
  {
    plugins: [
      parseJson(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### parseYaml

You can pass raw yaml string as input
```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseYaml } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle(
  'openapi: "3.1.1"\n',
  {
    plugins: [
      parseYaml(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

## dereference

## diff

## magic-proxy
